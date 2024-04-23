import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  BadRequestException,
  INestApplication,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RequestInterceptor } from './common/interceptors/request.interceptor';
import { ConfigService } from '@nestjs/config';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ErrorsInterceptor } from './common/interceptors/errors.interceptor';
import { PrismaService } from './common/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);
  const environment = configService.get('environment');
  const appPort = configService.get('app.port');
  const appHost = configService.get('app.host');
  const appHostname = configService.get('app.hostname');

  const initSwagger = (app: INestApplication, serverUrl: string) => {
    const config = new DocumentBuilder()
      .setTitle('Job Finder')
      .setDescription('Job Finder Web Application')
      .addServer(serverUrl)
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('/swagger', app, document);
  };

  if (environment !== 'production') {
    initSwagger(app, appHost);
  }

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  app.useGlobalInterceptors(
    new RequestInterceptor(),
    new ResponseInterceptor(),
    new ErrorsInterceptor(),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: {
        target: false,
        value: false,
      },
      exceptionFactory: (validationErrors: ValidationError[] = []) =>
        new BadRequestException(
          validationErrors.reduce(
            (errorObj, validationList) => ({
              ...errorObj,
              [validationList.property]: validationList,
            }),
            {},
          ),
        ),
    }),
  );

  app.enableCors({
    origin: '*',
  });
  const allowedOrigins = [
    /^(https:\/\/([^\.]*\.)?ngrok\.io)$/i,
    // 'https://job-search-api.onrender.com',
    'https://whale-app-wq7hc.ondigitalocean.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://job-search-front-end.vercel.app',
    '/^(https://([^.]*.)?job-search-front-end-[^.]+.vercel.app/)$/i',
  ];
  const allowedOriginsProd = [];
  const origins =
    environment === 'production' ? allowedOriginsProd : allowedOrigins;

  app.enableCors({
    origin: origins,
    credentials: true,
  });
  await app.listen(appPort, appHostname);
}

bootstrap();
