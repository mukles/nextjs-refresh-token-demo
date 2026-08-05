import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";

@ApiTags("status")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: "Get API status" })
  @ApiOkResponse({
    description: "The API is running",
    schema: { example: { status: "ok", service: "api" } },
  })
  getStatus() {
    return this.appService.getStatus();
  }

  @Get("health")
  @ApiOperation({ summary: "Check API health" })
  @ApiOkResponse({
    description: "The API is healthy",
    schema: { example: { status: "ok", service: "api" } },
  })
  getHealth() {
    return this.appService.getStatus();
  }
}
