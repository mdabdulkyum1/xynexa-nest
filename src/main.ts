import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Set global prefix
  const globalPrefix =
    configService.get<string>('app.globalPrefix') || 'api/v1';
  app.setGlobalPrefix(globalPrefix);

  // Get port from config
  const port = configService.get<number>('app.port') || 3000;

  // Enable CORS
  app.enableCors({
    origin: configService.get<string>('CLIENT_URL') || 'http://localhost:3000',
    credentials: true,
  });

  await app.listen(port);

  console.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

void bootstrap();
