import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Enable Helmet security headers
  app.use(helmet());

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later',
    }),
  );

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties that do not have decorators
      forbidNonWhitelisted: true, // throw errors if non-whitelisted values are provided
      transform: true, // transform payloads to be objects typed according to their DTO classes
    }),
  );

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('Authentication API')
    .setDescription('API documentation for authentication endpoints')
    .setVersion('1.0')
    .addTag('auth')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.info(`Application is running on port ${port}`);
  logger.info(
    `Swagger documentation available at http://localhost:${port}/api`,
  );
}

bootstrap().catch((error) => {
  logger.error('Application failed to start', { error });
  process.exit(1);
});
