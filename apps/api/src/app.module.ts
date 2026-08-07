import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthController } from "./auth/auth.controller";
import { AuthService } from "./auth/auth.service";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";
import { RefreshTokenRepository } from "./auth/repositories/refresh-token.repository";
import { SessionRepository } from "./auth/repositories/session.repository";
import { UserRepository } from "./auth/repositories/user.repository";
import { PrismaService } from "./prisma.service";
import { StoreController } from "./store/store.controller";
import { StoreRepository } from "./store/store.repository";
import { StoreService } from "./store/store.service";
import { StudentsController } from "./students/students.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
  ],
  controllers: [
    AppController,
    AuthController,
    StudentsController,
    StoreController,
  ],
  providers: [
    AppService,
    AuthService,
    JwtAuthGuard,
    PrismaService,
    // Repositories own all Prisma access; services never touch the client.
    UserRepository,
    RefreshTokenRepository,
    SessionRepository,
    StoreRepository,
    StoreService,
  ],
})
export class AppModule {}
