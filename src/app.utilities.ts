import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  RequestTimeoutException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  differenceInSeconds,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarYears,
} from 'date-fns';
import * as moment from 'moment';
import { customAlphabet } from 'nanoid';
import _ from 'lodash';
const CUSTOM_CHARS =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

@Injectable()
export class AppUtilities {
  public static handleException(error: any): Error {
    console.error(AppUtilities.requestErrorHandler(error));
    const errorCode: string = error.code;
    const message: string = error.meta
      ? error.meta.cause
        ? error.meta.cause
        : error.meta.field_name
        ? error.meta.field_name
        : error.meta.column
        ? error.meta.table
        : error.meta.table
      : error.message;
    switch (errorCode) {
      case 'P0000':
      case 'P2003':
      case 'P2004':
      case 'P2015':
      case 'P2018':
      case 'P2025':
        return new NotFoundException(message);
      case 'P2005':
      case 'P2006':
      case 'P2007':
      case 'P2008':
      case 'P2009':
      case 'P2010':
      case 'P2011':
      case 'P2012':
      case 'P2013':
      case 'P2014':
      case 'P2016':
      case 'P2017':
      case 'P2019':
      case 'P2020':
      case 'P2021':
      case 'P2022':
      case 'P2023':
      case 'P2026':
      case 'P2027':
        return new BadRequestException(message);
      case 'P2024':
        return new RequestTimeoutException(message);
      case 'P0001':
        return new UnauthorizedException(message);
      case 'P2002':
        const msg = `Conflict Exception: '${error.meta?.target?.[0]}' already exists!`;
        return new ConflictException(error.meta?.target?.[0] ? msg : message);
      default:
        console.error(message);
        if (!!message && message.toLocaleLowerCase().includes('arg')) {
          return new BadRequestException(
            'Invalid/Unknown field was found in the data set!',
          );
        } else {
          return error;
        }
    }
  }

  public static requestErrorHandler = (response: any = {}) => {
    const {
      message: errorMessage,
      response: serverResp,
      isCancel,
      isNetwork,
      config,
    } = response;

    let message = errorMessage,
      data: any = {},
      isServerError = false;

    if (serverResp?.data) {
      isServerError = true;
      message =
        serverResp.data?.error ||
        serverResp.data?.message ||
        'Unexpected error occurred!';
      data =
        typeof serverResp.data === 'object'
          ? { ...serverResp.data }
          : { data: serverResp.data };
    } else if (isCancel) {
      message = 'Request timed out.';
    } else if (isNetwork) {
      message = 'Network not available!';
    }

    const errorData = {
      message,
      isServerError,
      ...(isServerError && {
        data: {
          ...data,
          errorMessage,
          api: {
            method: config?.method,
            url: config?.url,
            baseURL: config?.baseURL,
          },
        },
      }),
    };

    return errorData;
  };

  public static async hasher(string: string): Promise<string> {
    const saltOrRounds = 10;
    const hashedPassword = bcrypt.hash(string, saltOrRounds);
    return hashedPassword;
  }

  public static generateRandomString(length: number): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++)
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    return result;
  }

  public static async validator(
    password: string,
    hashedPassword: string,
  ): Promise<any> {
    return bcrypt.compare(password, hashedPassword);
  }

  public static encode(
    data: string,
    encoding: BufferEncoding = 'base64',
  ): string {
    return Buffer.from(data).toString(encoding);
  }

  public static decode(
    data: string,
    encoding: BufferEncoding = 'base64',
  ): string {
    return Buffer.from(data, encoding).toString();
  }

  public static selectMultipleFields(fields: any[]): Record<string, true> {
    return fields.reduce((selectObject, field) => {
      selectObject[field] = true;
      return selectObject;
    }, {});
  }

  public static removeFields(fields: string[]): Record<string, true> {
    return fields.reduce((selectObject, field) => {
      selectObject[field] = true;
      return selectObject;
    }, {});
  }

  public static async addTimestamps(jobListings: any) {
    const getTimeAgoText = (timestamp: Date) => {
      const currentTime = new Date();
      const secondsAgo = differenceInSeconds(currentTime, timestamp);
      const minutesAgo = Math.floor(secondsAgo / 60);
      const hoursAgo = Math.floor(secondsAgo / 3600);
      const daysAgo = differenceInCalendarDays(currentTime, timestamp);
      const weeksAgo = Math.floor(daysAgo / 7);
      const monthsAgo = differenceInCalendarMonths(currentTime, timestamp);
      const yearsAgo = differenceInCalendarYears(currentTime, timestamp);

      if (secondsAgo < 60) {
        return `${secondsAgo} second${secondsAgo === 1 ? '' : 's'} ago`;
      } else if (secondsAgo < 3600) {
        return `${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`;
      } else if (secondsAgo < 86400) {
        return `${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago`;
      } else if (daysAgo < 7) {
        return `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`;
      } else if (daysAgo < 30) {
        return `${weeksAgo} week${weeksAgo === 1 ? '' : 's'} ago`;
      } else if (monthsAgo < 12) {
        return `${monthsAgo} month${monthsAgo === 1 ? '' : 's'} ago`;
      } else {
        return `${yearsAgo} year${yearsAgo === 1 ? '' : 's'} ago`;
      }
    };

    try {
      if (
        Array.isArray(jobListings) &&
        jobListings.every((item) => typeof item === 'object')
      ) {
        (jobListings as { pageEdges?: any[] })?.pageEdges?.forEach(
          (jobListing: any) => {
            jobListing.node.timeStamp = getTimeAgoText(
              moment(jobListing?.node?.createdAt).toDate(),
            );
          },
        );
      } else if (typeof jobListings === 'object') {
        const pageEdges = await jobListings;
        pageEdges.pageEdges.forEach((edge: any) => {
          const jobListing = edge.node;
          jobListing.timeStamp = getTimeAgoText(
            moment(jobListing?.createdAt).toDate(),
          );
        });
      } else {
        console.error('jobListings is neither an array nor an object');
        throw new BadRequestException(
          'An error occurred, if the error persists, contact Support',
        );
      }
    } catch (error) {
      console.error('Error while mapping jobListings:', error);
      throw error;
    }
  }

  public static async addTimestampBase(jobListings: any) {
    const getTimeAgoText = (timestamp: Date) => {
      const currentTime = new Date();
      const secondsAgo = differenceInSeconds(currentTime, timestamp);
      const minutesAgo = Math.floor(secondsAgo / 60);
      const hoursAgo = Math.floor(secondsAgo / 3600);
      const daysAgo = differenceInCalendarDays(currentTime, timestamp);
      const weeksAgo = Math.floor(daysAgo / 7);
      const monthsAgo = differenceInCalendarMonths(currentTime, timestamp);
      const yearsAgo = differenceInCalendarYears(currentTime, timestamp);

      if (secondsAgo < 60) {
        return `${secondsAgo} second${secondsAgo === 1 ? '' : 's'} ago`;
      } else if (secondsAgo < 3600) {
        return `${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`;
      } else if (secondsAgo < 86400) {
        return `${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago`;
      } else if (daysAgo < 7) {
        return `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`;
      } else if (daysAgo < 30) {
        return `${weeksAgo} week${weeksAgo === 1 ? '' : 's'} ago`;
      } else if (monthsAgo < 12) {
        return `${monthsAgo} month${monthsAgo === 1 ? '' : 's'} ago`;
      } else {
        return `${yearsAgo} year${yearsAgo === 1 ? '' : 's'} ago`;
      }
    };

    try {
      if (Array.isArray(jobListings)) {
        jobListings.forEach((jobListing: any) => {
          jobListing.timeStamp = getTimeAgoText(
            moment(jobListing.createdAt).toDate(),
          );
        });
      } else if (typeof jobListings === 'object') {
        jobListings.timeStamp = getTimeAgoText(
          moment(jobListings.createdAt).toDate(),
        );
      } else {
        console.error('jobListings is neither an array nor an object');
        throw new BadRequestException(
          'An error occurred, if the error persists, contact Support',
        );
      }
    } catch (error) {
      console.error('Error while mapping jobListings:', error);
      throw error;
    }
  }

  public static extractProperties(user: User) {
    const extractedProperties = {};
    const restProperties = {};
    const propertyMappings = {
      password: 'pwd',
      roleId: 'rlId',
      googleId: 'gId',
      lastLoginIp: 'llIp',
    };

    for (const key in user) {
      if (propertyMappings.hasOwnProperty(key)) {
        extractedProperties[propertyMappings[key]] = user[key];
      } else {
        restProperties[key] = user[key];
      }
    }

    return {
      extracted: extractedProperties,
      rest: restProperties,
    };
  }

  public static async calculateReadingTime(content, wordsPerMinute = 200) {
    const cleanedContent = content.replace(/\s+/g, ' ').trim();

    // Calculate word count
    const wordCount = cleanedContent.split(' ').length;

    // Assuming an average reading speed of 200 words per minute
    const minutes = Number(Math.ceil(wordCount / wordsPerMinute));

    return minutes <= 1 ? `${minutes} minute read` : `${minutes} minutes read`;
  }

  public static generateShortCode(charLen = 6): string {
    const nanoid = customAlphabet(CUSTOM_CHARS, charLen);

    return nanoid();
  }

  public static unflatten = (flattedObject: any) => {
    const result = [];
    _.keys(flattedObject).forEach(function (key) {
      key.split('|').forEach((path, resultIndex) => {
        _.set(result, `[${resultIndex}].${path}`, flattedObject[key]);
      });
    });
    return result;
  };
}
