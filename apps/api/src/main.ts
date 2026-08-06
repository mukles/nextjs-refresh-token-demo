import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import type { NextFunction, Request, Response } from "express";
import { AppModule } from "./app.module";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./auth/auth.service";

const localEnv = config({
  path: ".env.local",
  processEnv: {},
  quiet: true,
}).parsed;
if (localEnv?.DATABASE_URL) process.env.DATABASE_URL = localEnv.DATABASE_URL;
if (localEnv?.JWT_SECRET) process.env.JWT_SECRET = localEnv.JWT_SECRET;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const httpLogger = new Logger("HTTP");

  app.use((request: Request, response: Response, next: NextFunction) => {
    const startedAt = performance.now();
    response.once("finish", () => {
      const durationMs = Math.round(performance.now() - startedAt);
      const message = `${request.method} ${request.originalUrl} ${response.statusCode} ${durationMs}ms`;

      if (response.statusCode >= 500) httpLogger.error(message);
      else if (response.statusCode >= 400) httpLogger.warn(message);
      else httpLogger.log(message);
    });
    next();
  });
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  });
  app.setGlobalPrefix("api/v1");

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Refresh Token Demo API")
    .setDescription("OpenAPI documentation for the NestJS backend")
    .setVersion("1.0")
    .addCookieAuth(ACCESS_COOKIE, { type: "apiKey", in: "cookie" })
    .addCookieAuth(REFRESH_COOKIE, { type: "apiKey", in: "cookie" })
    .build();
  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup("docs", app, documentFactory, {
    jsonDocumentUrl: "docs/openapi.json",
    customSiteTitle: "Refresh Token Demo API Docs",
  });

  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
