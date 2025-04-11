export const oas = {
        "openapi": "3.0.0",
        "info": {
          "title": "Blog Platform API",
          "version": "1.0.0",
          "description": "API for a blog platform with authentication using Clerk and real-time notifications via WebSocket"
        },
        "servers": [
          {
            "url": "http://localhost:3000",
            "description": "Local development server"
          }
        ],
        "paths": {
          "/api/user/notifications": {
            "get": {
              "tags": ["Notifications"],
              "summary": "Get user notifications",
              "security": [{"BearerAuth": []}],
              "responses": {
                "200": {
                  "description": "List of notifications",
                  "content": {
                    "application/json": {
                      "schema": {
                        "type": "array",
                        "items": {"$ref": "#/components/schemas/Notification"}
                      }
                    }
                  }
                },
                "500": {
                  "description": "Internal server error",
                  "content": {
                    "application/json": {
                      "schema": {"$ref": "#/components/schemas/Error"}
                    }
                  }
                }
              }
            }
          },
          "/api/user/notifications/{id}/read": {
            "patch": {
              "tags": ["Notifications"],
              "summary": "Mark notification as read",
              "security": [{"BearerAuth": []}],
              "parameters": [{
                "name": "id",
                "in": "path",
                "required": true,
                "schema": {"type": "string"}
              }],
              "responses": {
                "200": {
                  "description": "Updated notification",
                  "content": {
                    "application/json": {
                      "schema": {"$ref": "#/components/schemas/Notification"}
                    }
                  }
                },
                "500": {
                  "description": "Internal server error",
                  "content": {
                    "application/json": {
                      "schema": {"$ref": "#/components/schemas/Error"}
                    }
                  }
                }
              }
            }
          },
          "/api/user/notifications/mark-all-read": {
            "patch": {
              "tags": ["Notifications"],
              "summary": "Mark all notifications as read",
              "security": [{"BearerAuth": []}],
              "responses": {
                "200": {
                  "description": "Success status",
                  "content": {
                    "application/json": {
                      "schema": {
                        "type": "object",
                        "properties": {
                          "success": {"type": "boolean"}
                        }
                      }
                    }
                  }
                },
                "500": {
                  "description": "Internal server error",
                  "content": {
                    "application/json": {
                      "schema": {"$ref": "#/components/schemas/Error"}
                    }
                  }
                }
              }
            }
          },
          "/api/user": {
            "get": {
              "tags": ["User"],
              "summary": "Get authenticated user details",
              "security": [{"BearerAuth": []}],
              "responses": {
                "200": {
                  "description": "User details",
                  "content": {
                    "application/json": {
                      "schema": {"$ref": "#/components/schemas/User"}
                    }
                  }
                }
              }
            }
          },
          "/api/blogs": {
            "get": {
              "tags": ["Blogs"],
              "summary": "Get paginated blogs",
              "parameters": [{
                "name": "pages",
                "in": "query",
                "schema": {"type": "integer", "default": 1}
              }],
              "responses": {
                "200": {
                  "description": "Paginated blog results",
                  "content": {
                    "application/json": {
                      "schema": {
                        "type": "object",
                        "properties": {
                          "totalItems": {"type": "integer"},
                          "currentPage": {"type": "integer"},
                          "totalPages": {"type": "integer"},
                          "all": {
                            "type": "array",
                            "items": {"$ref": "#/components/schemas/Blog"}
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "/api/user/blog": {
            "post": {
              "tags": ["Blogs"],
              "summary": "Create a new blog post",
              "security": [{"BearerAuth": []}],
              "requestBody": {
                "required": true,
                "content": {
                  "application/json": {
                    "schema": {
                      "type": "object",
                      "properties": {
                        "title": {"type": "string"},
                        "content": {"type": "string"}
                      },
                      "required": ["title", "content"]
                    }
                  }
                }
              },
              "responses": {
                "200": {
                  "description": "Created blog post",
                  "content": {
                    "application/json": {
                      "schema": {"$ref": "#/components/schemas/Blog"}
                    }
                  }
                },
                "500": {
                  "description": "Internal server error",
                  "content": {
                    "application/json": {
                      "schema": {"$ref": "#/components/schemas/Error"}
                    }
                  }
                }
              }
            }
          },
          "/api/blogs/{blogid}": {
            "get": {
              "tags": ["Blogs"],
              "summary": "Get specific blog post",
              "parameters": [{
                "name": "blogid",
                "in": "path",
                "required": true,
                "schema": {"type": "string"}
              }],
              "responses": {
                "200": {
                  "description": "Blog details",
                  "content": {
                    "application/json": {
                      "schema": {
                        "type": "object",
                        "properties": {
                          "uniqueblog": {"$ref": "#/components/schemas/Blog"}
                        }
                      }
                    }
                  }
                },
                "404": {
                  "description": "Blog not found",
                  "content": {
                    "application/json": {
                      "schema": {"$ref": "#/components/schemas/Error"}
                    }
                  }
                }
              }
            }
          },
          "/api/user/uploads": {
            "post": {
              "tags": ["Files"],
              "summary": "Upload and process a file",
              "security": [{"BearerAuth": []}],
              "requestBody": {
                "content": {
                  "multipart/form-data": {
                    "schema": {
                      "type": "object",
                      "properties": {
                        "file": {
                          "type": "string",
                          "format": "binary"
                        }
                      }
                    }
                  }
                }
              },
              "responses": {
                "200": {
                  "description": "Extracted text from file",
                  "content": {
                    "application/json": {
                      "schema": {
                        "type": "object",
                        "properties": {
                          "text": {"type": "string"}
                        }
                      }
                    }
                  }
                },
                "400": {
                  "description": "Bad request",
                  "content": {
                    "application/json": {
                      "schema": {"$ref": "#/components/schemas/Error"}
                    }
                  }
                },
                "500": {
                  "description": "File processing error",
                  "content": {
                    "application/json": {
                      "schema": {"$ref": "#/components/schemas/Error"}
                    }
                  }
                }
              }
            }
          }
        },
        "components": {
          "securitySchemes": {
            "BearerAuth": {
              "type": "http",
              "scheme": "bearer",
              "bearerFormat": "JWT",
              "description": "Clerk authentication token"
            }
          },
          "schemas": {
            "User": {
              "type": "object",
              "properties": {
                "id": {"type": "string"},
                "email": {"type": "string"},
                "createdAt": {"type": "string", "format": "date-time"},
                "updatedAt": {"type": "string", "format": "date-time"}
              }
            },
            "Blog": {
              "type": "object",
              "properties": {
                "id": {"type": "string"},
                "title": {"type": "string"},
                "content": {"type": "string"},
                "extractedContents": {
                  "type": "array",
                  "items": {"type": "string"}
                },
                "published": {"type": "boolean"},
                "authorId": {"type": "string"},
                "createdAt": {"type": "string", "format": "date-time"},
                "updatedAt": {"type": "string", "format": "date-time"}
              }
            },
            "Notification": {
              "type": "object",
              "properties": {
                "id": {"type": "string"},
                "message": {"type": "string"},
                "read": {"type": "boolean"},
                "userId": {"type": "string"},
                "createdAt": {"type": "string", "format": "date-time"}
              }
            },
            "Error": {
              "type": "object",
              "properties": {
                "error": {"type": "string"},
                "msg": {"type": "string"}
              }
            }
          }
        }
      }