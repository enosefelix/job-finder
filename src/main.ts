import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RequestInterceptor } from './common/interceptors/request.interceptor';
import { ConfigService } from '@nestjs/config';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);
  const environment = configService.get('environment');
  const appPort = configService.get('app.port');
  const appHost = configService.get('app.host');
  console.log('🚀 ~ file: main.ts:15 ~ bootstrap ~ appHost:', appHost);
  const appHostname = configService.get('app.hostname');

  app.enableCors();

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

  app.useGlobalInterceptors(
    new RequestInterceptor(),
    new ResponseInterceptor(),
  );
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  initSwagger(appPort, appHostname);
  await app.listen(appPort, appHostname);
}

bootstrap();
