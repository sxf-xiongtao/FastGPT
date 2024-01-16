import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { registerCron } from './timer';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3003);

  registerCron();
}
bootstrap();
