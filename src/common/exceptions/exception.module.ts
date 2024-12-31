import { Module } from "@nestjs/common";
import { ExceptionHelperService } from "./exception-helper.service";

@Module({
  providers: [ExceptionHelperService],
  exports: [ExceptionHelperService],
})
export class ExceptionHelperModule {}
