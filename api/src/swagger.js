import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

/**
 * OpenAPI/Swagger configuration for Open-Job API
 * Documents all endpoints: auth, users, jobs, applications,
 * companies, categories, bookmarks, documents, profile
 */
const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Open-Job API",
      version: "1.0.0",
      description:
        "RESTful API for Open-Job — a modern job portal connecting job seekers with companies. " +
        "Built with Express.js 5, PostgreSQL, Redis (caching), and RabbitMQ (async processing).",
      contact: {
        name: "PetaFlops-web",
        url: "https://github.com/PetaFlops-web/Open-Job",
      },
      license: {
        name: "ISC",
        url: "https://opensource.org/licenses/ISC",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local development server",
      },
      {
        url: "https://api.openjob.dev",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT access token",
        },
      },
      schemas: {
        // ---- Standard Response ----
        SuccessResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "success",
            },
            message: {
              type: "string",
              example: "Operation successful",
            },
            data: {
              type: "object",
              nullable: true,
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "failed",
            },
            message: {
              type: "string",
              example: "Error message",
            },
          },
        },
        HealthResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "ok",
            },
            timestamp: {
              type: "string",
              format: "date-time",
            },
            uptime: {
              type: "number",
              example: 12345.67,
            },
            services: {
              type: "object",
              properties: {
                database: {
                  type: "string",
                  enum: ["up", "down"],
                },
                redis: {
                  type: "string",
                  enum: ["up", "down"],
                },
                rabbitmq: {
                  type: "string",
                  enum: ["up", "down"],
                },
              },
            },
          },
        },
        // ---- User ----
        User: {
          type: "object",
          properties: {
            id: { type: "string", example: "user-abc123def456" },
            name: { type: "string", example: "John Doe" },
            email: { type: "string", format: "email", example: "john@example.com" },
            role: { type: "string", enum: ["jobseeker", "recruiter"], example: "jobseeker" },
          },
        },
        UserRegistration: {
          type: "object",
          required: ["name", "email", "password", "role"],
          properties: {
            name: { type: "string", example: "John Doe" },
            email: { type: "string", format: "email", example: "john@example.com" },
            password: { type: "string", example: "secretPassword123" },
            role: { type: "string", enum: ["jobseeker", "recruiter"], example: "jobseeker" },
          },
        },
        // ---- Authentication ----
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "john@example.com" },
            password: { type: "string", example: "secretPassword123" },
          },
        },
        TokenResponse: {
          type: "object",
          properties: {
            accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIs..." },
            refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIs..." },
          },
        },
        RefreshTokenRequest: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIs..." },
          },
        },
        // ---- Company ----
        Company: {
          type: "object",
          properties: {
            id: { type: "string", example: "company-abc123def456" },
            name: { type: "string", example: "Acme Corp" },
            location: { type: "string", example: "Jakarta, Indonesia" },
            description: { type: "string", example: "Leading tech company" },
            user_id: { type: "string", example: "user-abc123def456" },
          },
        },
        CompanyInput: {
          type: "object",
          required: ["name", "location"],
          properties: {
            name: { type: "string", example: "Acme Corp" },
            location: { type: "string", example: "Jakarta, Indonesia" },
            description: { type: "string", example: "Leading tech company" },
          },
        },
        // ---- Job ----
        Job: {
          type: "object",
          properties: {
            id: { type: "string", example: "job-abc123def456" },
            title: { type: "string", example: "Senior Frontend Developer" },
            description: { type: "string", example: "We are looking for..." },
            job_type: { type: "string", example: "full-time" },
            experience_level: { type: "string", example: "senior" },
            company_id: { type: "string", example: "company-abc123def456" },
            category_id: { type: "string", example: "category-abc123" },
            location_type: { type: "string", example: "remote" },
            location_city: { type: "string", example: "Jakarta" },
            salary_min: { type: "number", example: 5000000 },
            salary_max: { type: "number", example: 15000000 },
            is_salary_visible: { type: "boolean", example: true },
            status: { type: "string", example: "open" },
          },
        },
        JobInput: {
          type: "object",
          required: [
            "title",
            "description",
            "job_type",
            "experience_level",
            "company_id",
            "category_id",
            "status",
          ],
          properties: {
            title: { type: "string", example: "Senior Frontend Developer" },
            description: { type: "string", example: "We are looking for..." },
            job_type: { type: "string", example: "full-time" },
            experience_level: { type: "string", example: "senior" },
            company_id: { type: "string", example: "company-abc123def456" },
            category_id: { type: "string", example: "category-abc123" },
            location_type: { type: "string", example: "remote" },
            location_city: { type: "string", example: "Jakarta" },
            salary_min: { type: "number", example: 5000000 },
            salary_max: { type: "number", example: 15000000 },
            is_salary_visible: { type: "boolean", example: true },
            status: { type: "string", example: "open" },
          },
        },
        // ---- Category ----
        Category: {
          type: "object",
          properties: {
            id: { type: "string", example: "category-abc123" },
            name: { type: "string", example: "Software Engineering" },
          },
        },
        CategoryInput: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", example: "Software Engineering" },
          },
        },
        // ---- Application ----
        Application: {
          type: "object",
          properties: {
            id: { type: "string", example: "application-abc123" },
            job_id: { type: "string", example: "job-abc123def456" },
            user_id: { type: "string", example: "user-abc123def456" },
            status: { type: "string", example: "pending" },
          },
        },
        ApplicationInput: {
          type: "object",
          required: ["job_id", "status"],
          properties: {
            job_id: { type: "string", example: "job-abc123def456" },
            status: { type: "string", example: "pending" },
          },
        },
        ApplicationUpdateInput: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", example: "accepted" },
          },
        },
        // ---- Bookmark ----
        Bookmark: {
          type: "object",
          properties: {
            id: { type: "string", example: "bookmark-abc123" },
            user_id: { type: "string", example: "user-abc123def456" },
            job_id: { type: "string", example: "job-abc123def456" },
          },
        },
        // ---- Document ----
        Document: {
          type: "object",
          properties: {
            id: { type: "string", example: "document-abc123" },
            filename: { type: "string", example: "resume.pdf" },
            user_id: { type: "string", example: "user-abc123def456" },
          },
        },
        // ---- Profile ----
        Profile: {
          type: "object",
          properties: {
            id: { type: "string", example: "user-abc123def456" },
            name: { type: "string", example: "John Doe" },
            email: { type: "string", example: "john@example.com" },
            role: { type: "string", enum: ["jobseeker", "recruiter"], example: "jobseeker" },
          },
        },
        // ---- Interview ----
        ScheduleInterviewRequest: {
          type: "object",
          required: ["application_id", "company_id", "user_id", "job_id", "scheduled_at"],
          properties: {
            application_id: { type: "string" },
            company_id: { type: "string" },
            user_id: { type: "string" },
            job_id: { type: "string" },
            scheduled_at: { type: "string", format: "date-time" },
            duration_minutes: { type: "integer", default: 60 },
            timezone: { type: "string", default: "Asia/Jakarta" },
            interview_type: { type: "string", enum: ["video", "phone", "in-person"] },
            location: { type: "string" },
            meeting_link: { type: "string" },
            meeting_platform: { type: "string", enum: ["zoom", "gmeet", "teams"] },
            notes: { type: "string" },
          },
        },
        UpdateInterviewRequest: {
          type: "object",
          properties: {
            scheduled_at: { type: "string", format: "date-time" },
            duration_minutes: { type: "integer" },
            timezone: { type: "string" },
            interview_type: { type: "string", enum: ["video", "phone", "in-person"] },
            location: { type: "string" },
            meeting_link: { type: "string" },
            meeting_platform: { type: "string", enum: ["zoom", "gmeet", "teams"] },
            notes: { type: "string" },
            status: { type: "string", enum: ["scheduled", "completed", "cancelled", "no-show"] },
          },
        },
        SetAvailabilityRequest: {
          type: "object",
          required: ["company_id", "day_of_week", "start_time", "end_time"],
          properties: {
            company_id: { type: "string" },
            day_of_week: { type: "integer", description: "0=Sunday, 6=Saturday" },
            start_time: { type: "string", example: "09:00" },
            end_time: { type: "string", example: "17:00" },
            is_active: { type: "boolean", default: true },
          },
        },
        // ---- Notification ----
        Notification: {
          type: "object",
          properties: {
            id: { type: "string" },
            user_id: { type: "string" },
            type: { type: "string" },
            title: { type: "string" },
            message: { type: "string" },
            data: { type: "object" },
            read: { type: "boolean" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        UpdateNotificationPreferencesRequest: {
          type: "object",
          properties: {
            email_application: { type: "boolean" },
            email_interview: { type: "boolean" },
            push_application: { type: "boolean" },
            push_interview: { type: "boolean" },
            websocket_enabled: { type: "boolean" },
          },
        },
        // ---- MFA ----
        MFASetupResponse: {
          type: "object",
          properties: {
            secret: { type: "string" },
            qrcode_url: { type: "string" },
          },
        },
        MFAVerifyRequest: {
          type: "object",
          required: ["token"],
          properties: {
            token: { type: "string", description: "6-digit TOTP code" },
          },
        },
        // ---- Session ----
        Session: {
          type: "object",
          properties: {
            id: { type: "string" },
            device_info: { type: "object" },
            ip_address: { type: "string" },
            location: { type: "string" },
            is_active: { type: "boolean" },
            created_at: { type: "string", format: "date-time" },
            last_active_at: { type: "string", format: "date-time" },
          },
        },
        // ---- Developer ----
        CreateApiKeyRequest: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", description: "Key identifier name" },
            permissions: { type: "array", items: { type: "string" } },
          },
        },
        ApiKey: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            key_prefix: { type: "string" },
            permissions: { type: "array", items: { type: "string" } },
            rate_limit: { type: "integer" },
            is_active: { type: "boolean" },
            expires_at: { type: "string", format: "date-time" },
            last_used_at: { type: "string", format: "date-time" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        ApiKeyCreatedResponse: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            key: { type: "string", description: "Full API key (shown only once)" },
            prefix: { type: "string" },
          },
        },
        // ---- Health ----
        StatusResponse: {
          type: "string",
          enum: ["up", "down"],
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Unauthorized — invalid or missing JWT token",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
        NotFoundError: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
        ValidationError: {
          description: "Validation error — invalid request body",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
        RateLimitError: {
          description: "Too many requests — rate limit exceeded",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "error" },
                  message: { type: "string", example: "Too many requests, please try again later." },
                },
              },
            },
          },
        },
        ServerError: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
    tags: [
      { name: "Health", description: "Health check & monitoring endpoints" },
      { name: "Users", description: "User registration and management" },
      { name: "Authentication", description: "Login, token refresh, logout" },
      { name: "Companies", description: "Company profiles — CRUD operations" },
      { name: "Categories", description: "Job categories — CRUD operations" },
      { name: "Jobs", description: "Job postings — create, search, filter" },
      { name: "Applications", description: "Job applications — submit and manage" },
      { name: "Bookmarks", description: "Bookmark saved jobs" },
      { name: "Documents", description: "Upload and manage PDF documents" },
      { name: "Profile", description: "User profile, applications & bookmarks" },
      { name: "Interviews", description: "Interview scheduling and management" },
      { name: "Notifications", description: "Push and email notification preferences" },
      { name: "MFA", description: "Multi-factor authentication management" },
      { name: "Sessions", description: "User session management and device tracking" },
      { name: "Developer", description: "API key management for developer portal" },
    ],
  },
  // Scan route files for JSDoc annotations
  apis: ["./src/routes/*.js", "./src/health/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

/**
 * Setup Swagger UI on the Express app
 * @param {import('express').Express} app
 */
const setupSwagger = (app) => {
  const swaggerUiOptions = {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Open-Job API Documentation",
  };

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  // Serve raw OpenAPI JSON
  app.get("/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
};

export { setupSwagger };
