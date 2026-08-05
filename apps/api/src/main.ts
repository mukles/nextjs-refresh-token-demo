import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
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
