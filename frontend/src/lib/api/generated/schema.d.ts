/**
 * Tipos gerados a partir do OpenAPI do backend.
 * Execute `npm run openapi:generate` com a API no ar para atualizar este arquivo.
 */
export interface paths {
  "/api/v1/auth/login": {
    post: {
      requestBody: { content: { "application/json": { email: string; password: string } } };
      responses: { 200: { content: { "application/json": import("./types").AuthResponse } } };
    };
  };
  "/api/v1/auth/refresh": {
    post: {
      requestBody: { content: { "application/json": { refreshToken: string } } };
      responses: { 200: { content: { "application/json": import("./types").AuthResponse } } };
    };
  };
  "/api/v1/auth/me": {
    get: {
      responses: { 200: { content: { "application/json": import("./types").User } } };
    };
  };
}

export type { AuthResponse, User } from "./types";
