import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { initI18n } from "../src/i18n/setup.js";

function makeToken(role = "recruiter") {
  return jwt.sign(
    { id: "user-test-001", name: "Test User", email: "test@openjob.dev", role },
    process.env.ACCESS_TOKEN_KEY,
    { expiresIn: "5m" },
  );
}

describe("API Integration — HTTP Middleware Chain", () => {
  let tokenRecruiter;
  let tokenJobseeker;

  beforeAll(async () => {
    await initI18n();
    tokenRecruiter = makeToken("recruiter");
    tokenJobseeker = makeToken("jobseeker");
  });

  // ── Route registration ──

  describe("Route registration", () => {
    it("GET /health is reachable and returns services block", async () => {
      const res = await request(app).get("/health");
      // server.js connectRabbitMQ never called in direct app import → RabbitMQ down → 503
      expect([200, 503]).toContain(res.status);
      expect(res.body.services).toBeDefined();
      expect(res.body.services.database).toBeDefined();
    });
  });

  // ── Auth middleware ──

  describe("Authentication middleware", () => {
    it("rejects POST /companies without token → 401", async () => {
      const res = await request(app).post("/companies").send({ name: "Co", location: "Jkt" });
      expect(res.status).toBe(401);
      expect(res.body.status).toBe("failed");
      expect(res.body.message).toBe("Akses tidak diizinkan"); // default lang id
    });

    it("rejects with malformed Authorization header → 401", async () => {
      const res = await request(app)
        .post("/companies")
        .set("Authorization", "not-bearer")
        .send({ name: "Co", location: "Jkt" });
      expect(res.status).toBe(401);
    });

    it("rejects with garbage Bearer token → 401", async () => {
      const res = await request(app)
        .post("/companies")
        .set("Authorization", "Bearer garbage-token")
        .send({ name: "Co", location: "Jkt" });
      expect(res.status).toBe(401);
    });

    it("rejects GET /profile without token → 401", async () => {
      const res = await request(app).get("/profile");
      expect(res.status).toBe(401);
      expect(res.body.status).toBe("failed");
    });

    it("rejects GET /developer/keys without token → 401", async () => {
      const res = await request(app).get("/developer/keys");
      expect(res.status).toBe(401);
    });
  });

  // ── Validation middleware ──

  describe("Validation middleware", () => {
    it("rejects POST /companies with empty body → 400", async () => {
      const res = await request(app)
        .post("/companies")
        .set("Authorization", `Bearer ${tokenRecruiter}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("failed");
      expect(res.body.message).toBeTruthy();
    });

    it("rejects POST /companies with missing location → 400", async () => {
      const res = await request(app)
        .post("/companies")
        .set("Authorization", `Bearer ${tokenRecruiter}`)
        .send({ name: "Open Job" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBeTruthy();
    });
  });

  // ── Role middleware ──

  describe("Role middleware", () => {
    it("rejects jobseeker creating company → 403", async () => {
      const res = await request(app)
        .post("/companies")
        .set("Authorization", `Bearer ${tokenJobseeker}`)
        .send({ name: "Open Job", location: "Jakarta" });

      expect(res.status).toBe(403);
      expect(res.body.status).toBe("failed");
      expect(res.body.message).toBe("Akses dilarang");
    });
  });

  // ── Error handler middleware ──

  describe("Error handler middleware", () => {
    it("responds with 404 for non-existent route", async () => {
      const res = await request(app).get("/nonexistent-route-12345");
      expect(res.status).toBe(404);
    });
  });

  // ── Response format ──

  describe("Response format", () => {
    it("GET /health returns { status, services } structure", async () => {
      const res = await request(app).get("/health");
      expect(res.body).toHaveProperty("status");
      expect(res.body).toHaveProperty("services");
    });

    it("error responses have status and message", async () => {
      const res = await request(app).get("/profile");
      expect(res.body.status).toBe("failed");
      expect(res.body).toHaveProperty("message");
    });
  });

  // ── i18n middleware ──

  describe("i18n middleware", () => {
    it("returns Indonesian message with Accept-Language: id", async () => {
      const res = await request(app)
        .get("/profile")
        .set("Accept-Language", "id");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Akses tidak diizinkan");
    });

    it("returns English message with Accept-Language: en", async () => {
      const res = await request(app)
        .get("/profile")
        .set("Accept-Language", "en");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Unauthorized access");
    });

    it("returns English message with Accept-Language: en for role error", async () => {
      const res = await request(app)
        .post("/companies")
        .set("Authorization", `Bearer ${tokenJobseeker}`)
        .set("Accept-Language", "en")
        .send({ name: "Open Job", location: "Jakarta" });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Access forbidden");
    });
  });
});
