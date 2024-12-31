import { Global, Module } from "@nestjs/common";
import { ExceptionHelperService } from "./exception-helper.service";

@Global()
@Module({
  providers: [ExceptionHelperService],
  exports: [ExceptionHelperService],
})
export class ExceptionHelperModule {}
