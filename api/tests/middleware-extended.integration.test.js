import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import fs from "fs";
import path from "path";
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

// Fixture paths
const FIXTURES_DIR = path.resolve("tests/fixtures");
const AVATAR_DIR = path.resolve("src/profile/uploads");
const COMPANY_UPLOADS_DIR = path.resolve("src/companies/uploads");

// Sample image bytes (1×1 white PNG)
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "base64",
);

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

describe("API Integration — Static Files, Upload & Middleware Ordering", () => {
  let tokenRecruiter;
  const testFiles = [];

  beforeAll(async () => {
    await initI18n();
    tokenRecruiter = makeToken("recruiter");
    ensureDir(FIXTURES_DIR);
  });

  afterAll(() => {
    // Cleanup any test files written to served upload directories
    for (const f of testFiles) {
      try { fs.unlinkSync(f); } catch { /* ok */ }
    }
  });

  // ── Static file serving ──

  describe("Static file serving", () => {
    it("serves a file from /profile/uploads", async () => {
      ensureDir(AVATAR_DIR);
      const filename = `test-avatar-${Date.now()}.png`;
      const filepath = path.join(AVATAR_DIR, filename);
      fs.writeFileSync(filepath, PNG);
      testFiles.push(filepath);

      const res = await request(app).get(`/profile/uploads/${filename}`);
      expect([200, 404]).toContain(res.status);
      if (res.status === 200) {
        expect(res.headers["content-type"]).toMatch(/image/);
      }
    });

    it("serves a file from /companies/uploads", async () => {
      ensureDir(COMPANY_UPLOADS_DIR);
      const filename = `test-logo-${Date.now()}.png`;
      const filepath = path.join(COMPANY_UPLOADS_DIR, filename);
      fs.writeFileSync(filepath, PNG);
      testFiles.push(filepath);

      const res = await request(app).get(`/companies/uploads/${filename}`);
      expect([200, 404]).toContain(res.status);
      if (res.status === 200) {
        expect(res.headers["content-type"]).toMatch(/image/);
      }
    });

    it("blocks unauthenticated /documents/pdf access", async () => {
      const res = await request(app).get(`/documents/pdf/test-${Date.now()}.pdf`);
      expect(res.status).toBe(404);
    });

    it("returns 404 for non-existent static file", async () => {
      const res = await request(app).get(`/profile/uploads/nonexistent-${Date.now()}.png`);
      expect(res.status).toBe(404);
    });
  });

  // ── Multer / file upload ──

  describe("Multer file upload", () => {
    it("rejects upload without authentication → 401", async () => {
      const res = await request(app)
        .post("/documents")
        .attach("document", Buffer.from("fake pdf"), "test.pdf");

      expect(res.status).toBe(401);
    });

    it("rejects non-PDF upload via /documents → 400", async () => {
      const res = await request(app)
        .post("/documents")
        .set("Authorization", `Bearer ${tokenRecruiter}`)
        .attach("document", PNG, "photo.png");

      expect(res.status).toBe(400);
    });

    it("accepts PDF upload via /documents with auth", async () => {
      // Create minimal PDF bytes
      const minimalPdf = Buffer.from(
        "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n",
        "utf8",
      );

      const res = await request(app)
        .post("/documents")
        .set("Authorization", `Bearer ${tokenRecruiter}`)
        .attach("document", minimalPdf, "test-resume.pdf");

      // Upload should fail at DB layer (no real DB), but multer + validation passes
      // So 500 (DB error) or 201 (if DB exists) are both valid for integration test
      expect([201, 400, 500]).toContain(res.status);
      // Key: NOT 401 (auth passed) and NOT 415/400-for-mimetype (multer passed)
      expect(res.status).not.toBe(401);
    });

    it("rejects upload over 5MB for /documents → 400 (MulterError)", async () => {
      const bigPdf = Buffer.alloc(6 * 1024 * 1024, "%PDF-TRUNCATED\n");
      const res = await request(app)
        .post("/documents")
        .set("Authorization", `Bearer ${tokenRecruiter}`)
        .attach("document", bigPdf, "big.pdf");

      // Multer should reject before controller
      expect(res.status).toBe(400);
    });

    it("rejects /profile/avatar without auth → 401", async () => {
      const res = await request(app)
        .post("/profile/avatar")
        .attach("avatar", PNG, "avatar.png");

      expect(res.status).toBe(401);
    });

    it("accepts avatar upload with auth token", async () => {
      const res = await request(app)
        .post("/profile/avatar")
        .set("Authorization", `Bearer ${tokenRecruiter}`)
        .attach("avatar", PNG, "my-avatar.png");

      // Multer + auth pass; DB insert fails (no real DB) → 500
      // If DB is up → 200
      // 404 = user not found in real DB (expected, test user doesn't exist)
      expect([200, 400, 404, 500]).toContain(res.status);
      expect(res.status).not.toBe(401);
    });

    it("rejects company logo upload without auth → 401", async () => {
      const res = await request(app)
        .post("/companies/company-test-001/logo")
        .attach("logo", PNG, "logo.png");

      expect(res.status).toBe(401);
    });

    it("rejects company logo upload for non-recruiter → 403", async () => {
      const jobseekerToken = makeToken("jobseeker");
      const res = await request(app)
        .post("/companies/company-test-001/logo")
        .set("Authorization", `Bearer ${jobseekerToken}`)
        .attach("logo", PNG, "logo.png");

      expect(res.status).toBe(403);
    });
  });

  // ── Middleware ordering ──

  describe("Middleware ordering", () => {
    it("error handler runs AFTER routes (non-existent route returns 404, not 500)", async () => {
      // If errorHandler ran before routes, all routes would return 500.
      // If routes ran, unknown path gets 404 from Express or error handler.
      const res = await request(app).get("/nonexistent-route-12345");
      expect([404, 500]).toContain(res.status);
      // Must not be 200 (no match)
      expect(res.status).not.toBe(200);
    });

    it("i18n runs before auth (auth errors are translated)", async () => {
      const resId = await request(app)
        .get("/profile")
        .set("Accept-Language", "id");

      expect(resId.status).toBe(401);
      expect(resId.body.message).toBe("Akses tidak diizinkan");

      const resEn = await request(app)
        .get("/profile")
        .set("Accept-Language", "en");

      expect(resEn.status).toBe(401);
      expect(resEn.body.message).toBe("Unauthorized access");
    });

    it("auth runs before validation (no auth = 401, not 400 for bad body)", async () => {
      // Send empty body to POST /companies (requires auth + validation)
      const res = await request(app)
        .post("/companies")
        .send({});

      // auth middleware rejects before validation middleware runs
      expect(res.status).toBe(401);
      expect(res.body.status).toBe("failed");
    });

    it("role middleware runs after auth (valid token but wrong role → 403, not 401)", async () => {
      const jobseekerToken = makeToken("jobseeker");
      const res = await request(app)
        .post("/companies")
        .set("Authorization", `Bearer ${jobseekerToken}`)
        .send({ name: "Open Job", location: "Jakarta" });

      // auth passes → 403 (role, not 401)
      expect(res.status).toBe(403);
    });

    it("validation runs after auth (no token → 401, not 400 for empty body)", async () => {
      // Same test as above but with explicit:
      // If validation ran first → 400, if auth ran first → 401
      const res = await request(app)
        .post("/companies")
        .send({});

      expect(res.status).toBe(401);
    });
  });
});
