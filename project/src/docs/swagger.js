import swaggerJsdoc from "swagger-jsdoc";

const port = process.env.PORT || "3000";

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Backend Project API",
      version: "1.0.0",
      description: "Swagger documentation for authentication, image, and CSV APIs.",
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: "Local server",
      },
    ],
    tags: [
      { name: "Auth", description: "Authentication and user management endpoints" },
      { name: "Images", description: "Image upload and retrieval endpoints" },
      { name: "CSV", description: "CSV import/export endpoints" },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
          description: "Authentication uses the accessToken cookie set by login.",
        },
      },
      schemas: {
        ApiError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Unauthorized request" },
            errors: {
              type: "array",
              items: { type: "string" },
              example: [],
            },
            data: { nullable: true, example: null },
          },
        },
        ProfilePicture: {
          type: "object",
          properties: {
            fileName: { type: "string", example: "profilePic-1763529742807.jpg" },
            filePath: { type: "string", example: "uploads/profilePic-1763529742807.jpg" },
            mimeType: { type: "string", example: "image/jpeg" },
            size: { type: "number", example: 124000 },
          },
        },
        UserPublic: {
          type: "object",
          properties: {
            _id: { type: "string", example: "67324093dbf0d77f67f40ef3" },
            username: { type: "string", example: "sumit" },
            email: { type: "string", format: "email", example: "sumit@example.com" },
            firstName: { type: "string", example: "Sumit" },
            lastName: { type: "string", example: "Sengar" },
            role: { type: "string", enum: ["admin", "member", "reviewer"], example: "reviewer" },
            profilePicture: { $ref: "#/components/schemas/ProfilePicture" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        ApiResponseBase: {
          type: "object",
          properties: {
            statusCode: { type: "number", example: 200 },
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Success" },
            data: { type: "object" },
          },
        },
        Image: {
          type: "object",
          properties: {
            _id: { type: "string", example: "6732411adb7a3f7c8f9ce099" },
            fileName: { type: "string", example: "mypic-1762923927384.jpg" },
            filePath: { type: "string", example: "uploads/mypic-1762923927384.jpg" },
            mimeType: { type: "string", example: "image/jpeg" },
            size: { type: "number", example: 94012 },
            uploadedBy: { type: "string", example: "67324093dbf0d77f67f40ef3" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
    paths: {
      "/": {
        get: {
          summary: "Health check",
          description: "Returns a basic Hello World response.",
          responses: {
            200: {
              description: "Server is running",
              content: {
                "text/plain": {
                  schema: { type: "string", example: "Hello World!" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["firstName", "lastName", "username", "email", "password"],
                  properties: {
                    firstName: { type: "string" },
                    lastName: { type: "string" },
                    username: { type: "string" },
                    email: { type: "string", format: "email" },
                    password: { type: "string", format: "password" },
                    role: { type: "string", enum: ["admin", "member", "reviewer"] },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "User registered",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/ApiResponseBase" },
                      {
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              user: { $ref: "#/components/schemas/UserPublic" },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            409: {
              description: "User already exists",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login",
          description: "Logs in a user and sets accessToken/refreshToken cookies.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string", format: "password" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Logged in",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/ApiResponseBase" },
                      {
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              user: { $ref: "#/components/schemas/UserPublic" },
                              accessToken: { type: "string" },
                              refreshToken: { type: "string" },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            400: {
              description: "Invalid credentials",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/refresh-token": {
        post: {
          tags: ["Auth"],
          summary: "Refresh access token",
          description: "Uses refreshToken cookie and returns new access/refresh tokens.",
          responses: {
            200: {
              description: "Token refreshed",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/ApiResponseBase" },
                      {
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              accessToken: { type: "string" },
                              refreshToken: { type: "string" },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/forgot-password": {
        post: {
          tags: ["Auth"],
          summary: "Request password reset",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email"],
                  properties: {
                    email: { type: "string", format: "email" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Reset link sent" },
            404: {
              description: "User not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/forgot-password/{resetToken}": {
        post: {
          tags: ["Auth"],
          summary: "Reset password using token",
          parameters: [
            {
              name: "resetToken",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["newPassword"],
                  properties: {
                    newPassword: { type: "string", format: "password" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Password reset successful" },
            409: {
              description: "Invalid or expired link",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Get current user role",
          security: [{ cookieAuth: [] }],
          responses: {
            200: {
              description: "Authenticated",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/ApiResponseBase" },
                      {
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              role: {
                                type: "string",
                                enum: ["admin", "member", "reviewer"],
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/user-details": {
        post: {
          tags: ["Auth"],
          summary: "Get user details by email",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email"],
                  properties: {
                    email: { type: "string", format: "email" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "User fetched",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/ApiResponseBase" },
                      {
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              user: { $ref: "#/components/schemas/UserPublic" },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            404: {
              description: "User not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Logout",
          security: [{ cookieAuth: [] }],
          responses: {
            200: { description: "Logged out and cookies cleared" },
          },
        },
      },
      "/api/v1/auth/reset-password": {
        post: {
          tags: ["Auth"],
          summary: "Reset password (authenticated user)",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["oldPassword", "newPassword"],
                  properties: {
                    oldPassword: { type: "string", format: "password" },
                    newPassword: { type: "string", format: "password" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Password updated" },
            400: {
              description: "Invalid old password",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/users": {
        get: {
          tags: ["Auth"],
          summary: "List users with pagination",
          security: [{ cookieAuth: [] }],
          parameters: [
            {
              name: "page",
              in: "query",
              required: false,
              schema: { type: "integer", default: 1, minimum: 1 },
            },
            {
              name: "pageSize",
              in: "query",
              required: false,
              schema: { type: "integer", default: 20, minimum: 1 },
            },
            {
              name: "search",
              in: "query",
              required: false,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Paginated users list",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      metadata: {
                        type: "object",
                        properties: {
                          totalCount: { type: "integer" },
                          page: { type: "integer" },
                          pageSize: { type: "integer" },
                          totalPages: { type: "integer" },
                        },
                      },
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/UserPublic" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/delete": {
        delete: {
          tags: ["Auth"],
          summary: "Delete user by email (admin only)",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email"],
                  properties: {
                    email: { type: "string", format: "email" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "User deleted" },
            403: {
              description: "Forbidden",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/update-user": {
        patch: {
          tags: ["Auth"],
          summary: "Update user details (admin/reviewer)",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email"],
                  properties: {
                    email: { type: "string", format: "email" },
                    firstName: { type: "string" },
                    lastName: { type: "string" },
                    role: { type: "string", enum: ["admin", "member", "reviewer"] },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "User updated",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/ApiResponseBase" },
                      {
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              user: { $ref: "#/components/schemas/UserPublic" },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            404: {
              description: "User not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/profile-picture": {
        post: {
          tags: ["Auth"],
          summary: "Upload current user's profile picture",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["profilePic"],
                  properties: {
                    profilePic: {
                      type: "string",
                      format: "binary",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Profile picture updated" },
          },
        },
        delete: {
          tags: ["Auth"],
          summary: "Delete current user's profile picture",
          security: [{ cookieAuth: [] }],
          responses: {
            200: { description: "Profile picture deleted or not found" },
          },
        },
      },
      "/api/v1/auth/profile-pic-ad": {
        post: {
          tags: ["Auth"],
          summary: "Upload profile picture for a user by email (admin only)",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["email", "profilePic"],
                  properties: {
                    email: { type: "string", format: "email" },
                    profilePic: { type: "string", format: "binary" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Profile picture updated" },
            403: {
              description: "Forbidden",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
        delete: {
          tags: ["Auth"],
          summary: "Delete profile picture for a user by email (admin only)",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email"],
                  properties: {
                    email: { type: "string", format: "email" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Profile picture deleted or not found" },
            403: {
              description: "Forbidden",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/api/v1/image/upload": {
        post: {
          tags: ["Images"],
          summary: "Upload image",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["mypic"],
                  properties: {
                    mypic: { type: "string", format: "binary" },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Image uploaded",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/ApiResponseBase" },
                      {
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              image: { $ref: "#/components/schemas/Image" },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      "/api/v1/image/my-images": {
        get: {
          tags: ["Images"],
          summary: "Get current user's uploaded images",
          security: [{ cookieAuth: [] }],
          responses: {
            200: {
              description: "Images fetched",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/ApiResponseBase" },
                      {
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              images: {
                                type: "array",
                                items: {
                                  allOf: [
                                    { $ref: "#/components/schemas/Image" },
                                    {
                                      type: "object",
                                      properties: {
                                        fileUrl: {
                                          type: "string",
                                          example: "http://localhost:3000/uploads/mypic-1762923927384.jpg",
                                        },
                                      },
                                    },
                                  ],
                                },
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      "/api/v1/image/delete": {
        delete: {
          tags: ["Images"],
          summary: "Delete all current user's images",
          security: [{ cookieAuth: [] }],
          responses: {
            200: { description: "Images deleted or no images found" },
          },
        },
      },
      "/api/v1/image/images/{imageId}": {
        get: {
          tags: ["Images"],
          summary: "Download image by id",
          parameters: [
            {
              name: "imageId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Image file stream",
              content: {
                "application/octet-stream": {
                  schema: { type: "string", format: "binary" },
                },
              },
            },
            404: {
              description: "Image or file not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/api/v1/export/export-users": {
        get: {
          tags: ["CSV"],
          summary: "Export users as CSV",
          security: [{ cookieAuth: [] }],
          responses: {
            200: {
              description: "CSV file",
              content: {
                "text/csv": {
                  schema: {
                    type: "string",
                    example: "email,username,firstName,lastName,role",
                  },
                },
              },
            },
          },
        },
      },
      "/api/v1/export/import-users": {
        post: {
          tags: ["CSV"],
          summary: "Import users from CSV",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["file"],
                  properties: {
                    file: { type: "string", format: "binary" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Import summary",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/ApiResponseBase" },
                      {
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              imported: { type: "integer" },
                              error: {
                                type: "array",
                                items: {
                                  type: "object",
                                  properties: {
                                    row: { type: "integer" },
                                    reason: { type: "string" },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            400: {
              description: "Invalid CSV",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
