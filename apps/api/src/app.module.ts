import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthController } from "./auth/auth.controller";
import { AuthService } from "./auth/auth.service";
import { PrismaService } from "./prisma.service";
import { StudentsController } from "./students/students.controller";
import { StoreController } from "./store/store.controller";
import { StoreService } from "./store/store.service";

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
  providers: [AppService, AuthService, PrismaService, StoreService],
})
export class AppModule {}
