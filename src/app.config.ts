import * as dotenv from 'dotenv';

dotenv.config();

const env = (key: string, defaultVal: any = undefined) => {
  return process.env[key] || defaultVal;
};

env.require = (key: string, defaultVal: any = undefined) => {
  const value = process.env[key] || defaultVal;
  if (!value) {
    throw new Error(`Environment variable '${key}' is missing!`);
  }

  return value;
};

const config = {
  environment: env.require('NODE_ENV', 'production'),
  app: {
    name: 'job-finder-be',
    port: parseInt(env('APP_PORT', 3000)),
    hostname: env('APP_HOSTNAME'),
    host: env('APP_HOST'), // change this to the server your stuff is listening on
    api: {
      version: env('APP_API_VERSION', 'api/v3'),
    },
  },
  db: {
    url: env.require('DATABASEURL'),
  },

  redis: {
    host: env.require('REDIS_HOST', 'localhost'),
    port: env('REDIS_PORT', '6379'),
    password: env('REDIS_PASSWORD'),
  },
  jwt: {
    secret: env.require('JWT_SECRET'),
    signOptions: {
      expiresIn: parseInt(env('JWT_EXPIRES', 30 * 60)),
    },
    refreshTokenExpiresIn: parseInt(
      env(
        'JWT_REFRESH_TOKEN_EXPIRES',
        6 * 60 * 60, // 6 hrs
      ),
    ),
    expiresIn: env.require('EXPIRES_IN'),
  },
  cloudinary: {
    folder: env.require('NODE_ENV', 'production'),
    subfolder: env
      .require(
        'APP_HOST',
        `http://localhost:${parseInt(env('APP_PORT', 3001))}`,
      )
      .replace(/\//g, ''),
  },
  smtp: {
    transport: {
      host: env.require('MAIL_HOST'),
      port: Number(env('MAIL_PORT', 587)),
      secure: env.require('MAIL_SECURITY') === 'true',
      auth: {
        user: env('MAIL_USER'),
        pass: env('MAIL_PASSWORD'),
      },
    },
    defaults: {
      // from: '"IWIA" <no-reply@mailer.com>',
      from: {
        name: 'IWIA',
        address: 'no-reply@mailer.com',
      },
    },
    attachments: {
      imagePath:
        'aHR0cHM6Ly9yZXMuY2xvdWRpbmFyeS5jb20vZGpta3l4eGJjL2ltYWdlL3VwbG9hZC92MTY5NzYxNDYzOC9kZXZlbG9wbWVudC9odHRwczp3aGFsZS1hcHAtd3E3aGMub25kaWdpdGFsb2NlYW4uYXBwL2ltYWdlcy9tYWlsLWltYWdlcy9pLVdvcmstaW4tQWZyaWthX3Z5MXM4ei5wbmc=',
    },
  },
};

export default () => config;
