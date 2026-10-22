import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import Fastify from "fastify";
import { mkdir } from "node:fs/promises";
import { config } from "./config.js";
import { drawingsRoutes, sendError } from "./routes/drawings.js";

const app = Fastify({
  logger: true,
  // Nginx on the host terminates TLS and forwards the client IP.
  trustProxy: true,
});

await app.register(cors, {
  origin: config.allowedOrigins.includes("*") ? true : config.allowedOrigins,
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type"],
  exposedHeaders: ["Content-Disposition", "Content-Length"],
});
await app.register(multipart, { limits: { fileSize: config.maxFileBytes, files: 1 } });

app.setErrorHandler((error, request, reply) => sendError(error, request, reply));

app.get("/health", async () => ({ ok: true }));
await app.register(drawingsRoutes);

await mkdir(config.storageRoot, { recursive: true });
await app.listen({ port: config.port, host: config.host });
