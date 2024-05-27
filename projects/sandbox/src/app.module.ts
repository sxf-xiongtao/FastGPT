import { Module } from '@nestjs/common';
import { SandboxController } from './sandbox/sandbox.controller';
import { SandboxService } from './sandbox/sandbox.service';
import { APP_FILTER } from '@nestjs/core';

@Module({
  imports: [],
  controllers: [SandboxController],
  providers: [
    SandboxService
    // {
    //   provide: APP_FILTER,
    //   useClass: HttpExceptionFilter,
    // },
  ]
})
export class AppModule {}
