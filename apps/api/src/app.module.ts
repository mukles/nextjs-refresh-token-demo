import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthController } from "./auth/auth.controller";
import { AuthService } from "./auth/auth.service";
import { PrismaService } from "./prisma.service";
import { StudentsController } from "./students/students.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
  ],
  controllers: [AppController, AuthController, StudentsController],
  providers: [AppService, AuthService, PrismaService],
})
export class AppModule {}
