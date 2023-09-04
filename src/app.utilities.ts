import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  RequestTimeoutException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  formatDistanceToNow,
  differenceInSeconds,
  differenceInCalendarISOWeekYears,
  differenceInCalendarDays,
  differenceInCalendarWeeks,
  differenceInCalendarMonths,
  differenceInCalendarYears,
} from 'date-fns';
import * as moment from 'moment';

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

  public static generateToken(length: number): number[] {
    const token: number[] = [];
    for (let i = 0; i < length; i++) {
      const randomNumber = Math.floor(Math.random() * 10); // Generate a random number between 0 and 9
      token.push(randomNumber);
    }
    return token;
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
    try {
      if (
        Array.isArray(jobListings) &&
        jobListings.every((item) => typeof item === 'object')
      ) {
        (jobListings as { pageEdges?: any[] })?.pageEdges?.map(
          (jobListing: any) => {
            console.log('kalnsd;anfdkl;amkldfnamlksa,;');

            const timeStamp = moment(jobListing?.node?.createdAt).toDate();
            console.log(
              '🚀 ~ file: app.utilities.ts:201 ~ AppUtilities ~ addTimestamps ~ timeStamp:',
              timeStamp,
            );
            const currentTime = moment().toDate();
            const secondsAgo = differenceInSeconds(currentTime, timeStamp);
            const minutesAgo = Math.floor(secondsAgo / 60);
            const hoursAgo = Math.floor(secondsAgo / 3600);
            const daysAgo = differenceInCalendarDays(currentTime, timeStamp);
            const weeksAgo = Math.floor(daysAgo / 7);
            const monthsAgo = differenceInCalendarMonths(
              currentTime,
              timeStamp,
            );
            const yearsAgo = differenceInCalendarYears(currentTime, timeStamp);

            let timeStampText: string;

            if (secondsAgo < 60) {
              timeStampText = `${secondsAgo} second${
                secondsAgo === 1 ? '' : 's'
              } ago`;
            } else if (secondsAgo < 3600) {
              timeStampText = `${minutesAgo} minute${
                minutesAgo === 1 ? '' : 's'
              } ago`;
            } else if (secondsAgo < 86400) {
              timeStampText = `${hoursAgo} hour${
                hoursAgo === 1 ? '' : 's'
              } ago`;
            } else if (daysAgo < 7) {
              timeStampText = `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`;
            } else if (daysAgo < 30) {
              timeStampText = `${weeksAgo} week${
                weeksAgo === 1 ? '' : 's'
              } ago`;
            } else if (monthsAgo < 12) {
              timeStampText = `${monthsAgo} month${
                monthsAgo === 1 ? '' : 's'
              } ago`;
            } else {
              timeStampText = `${yearsAgo} year${
                yearsAgo === 1 ? '' : 's'
              } ago`;
            }

            jobListing.node.timeStamp = timeStampText;
          },
        );
      } else if (typeof jobListings === 'object') {
        const pageEdges = await jobListings;
        console.log(
          '🚀 ~ file: app.utilities.ts:252 ~ AppUtilities ~ addTimestamps ~ pageEdges:',
          pageEdges.pageEdges,
        );
        pageEdges.pageEdges.forEach((edge: any) => {
          const jobListing = edge.node;
          const timeStamp = moment(jobListing?.createdAt).toDate();
          const currentTime = moment().toDate();
          const secondsAgo = differenceInSeconds(currentTime, timeStamp);
          const minutesAgo = Math.floor(secondsAgo / 60);
          const hoursAgo = Math.floor(secondsAgo / 3600);
          const daysAgo = differenceInCalendarDays(currentTime, timeStamp);
          const weeksAgo = Math.floor(daysAgo / 7);
          const monthsAgo = differenceInCalendarMonths(currentTime, timeStamp);
          const yearsAgo = differenceInCalendarYears(currentTime, timeStamp);

          let timeStampText: string;

          if (secondsAgo < 60) {
            timeStampText = `${secondsAgo} second${
              secondsAgo === 1 ? '' : 's'
            } ago`;
          } else if (secondsAgo < 3600) {
            timeStampText = `${minutesAgo} minute${
              minutesAgo === 1 ? '' : 's'
            } ago`;
          } else if (secondsAgo < 86400) {
            timeStampText = `${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago`;
          } else if (daysAgo < 7) {
            timeStampText = `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`;
          } else if (daysAgo < 30) {
            timeStampText = `${weeksAgo} week${weeksAgo === 1 ? '' : 's'} ago`;
          } else if (monthsAgo < 12) {
            timeStampText = `${monthsAgo} month${
              monthsAgo === 1 ? '' : 's'
            } ago`;
          } else {
            timeStampText = `${yearsAgo} year${yearsAgo === 1 ? '' : 's'} ago`;
          }

          jobListing.timeStamp = timeStampText;
        });
      } else {
        console.error('jobListings is neither an array nor an object');
        throw new BadRequestException(
          'An error occured, if error persists contact Support',
        );
      }
    } catch (error) {
      console.error('Error while mapping jobListings:', error);
      throw error;
    }
  }
  public static async addTimestampBase(jobListings: any) {
    console.log(jobListings);

    if (
      Array.isArray(jobListings) &&
      jobListings.every((item) => typeof item === 'object')
    ) {
      try {
        jobListings?.map((jobListing: any) => {
          const timeStamp = moment(jobListing.createdAt).toDate();
          const currentTime = moment().toDate();
          const secondsAgo = differenceInSeconds(currentTime, timeStamp);
          const minutesAgo = Math.floor(secondsAgo / 60);
          const hoursAgo = Math.floor(secondsAgo / 3600);
          const daysAgo = differenceInCalendarDays(currentTime, timeStamp);
          const weeksAgo = Math.floor(daysAgo / 7);
          const monthsAgo = differenceInCalendarMonths(currentTime, timeStamp);
          const yearsAgo = differenceInCalendarYears(currentTime, timeStamp);

          let timeStampText: string;

          if (secondsAgo < 60) {
            timeStampText = `${secondsAgo} second${
              secondsAgo === 1 ? '' : 's'
            } ago`;
          } else if (secondsAgo < 3600) {
            timeStampText = `${minutesAgo} minute${
              minutesAgo === 1 ? '' : 's'
            } ago`;
          } else if (secondsAgo < 86400) {
            timeStampText = `${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago`;
          } else if (daysAgo < 7) {
            timeStampText = `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`;
          } else if (daysAgo < 30) {
            timeStampText = `${weeksAgo} week${weeksAgo === 1 ? '' : 's'} ago`;
          } else if (monthsAgo < 12) {
            timeStampText = `${monthsAgo} month${
              monthsAgo === 1 ? '' : 's'
            } ago`;
          } else {
            timeStampText = `${yearsAgo} year${yearsAgo === 1 ? '' : 's'} ago`;
          }
          console.log(`${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`);

          jobListing.timeStamp = timeStampText;
        });
      } catch (error) {
        console.error('Error while mapping jobListings:', error);
        throw error;
      }
    } else if (typeof jobListings === 'object') {
      const timeStamp = moment(jobListings.createdAt).toDate();
      const currentTime = moment().toDate();
      const secondsAgo = differenceInSeconds(currentTime, timeStamp);
      const minutesAgo = Math.floor(secondsAgo / 60);
      const hoursAgo = Math.floor(secondsAgo / 3600);
      const daysAgo = differenceInCalendarDays(currentTime, timeStamp);
      const weeksAgo = Math.floor(daysAgo / 7);
      const monthsAgo = differenceInCalendarMonths(currentTime, timeStamp);
      const yearsAgo = differenceInCalendarYears(currentTime, timeStamp);

      let timeStampText: string;

      if (secondsAgo < 60) {
        timeStampText = `${secondsAgo} second${
          secondsAgo === 1 ? '' : 's'
        } ago`;
      } else if (secondsAgo < 3600) {
        timeStampText = `${minutesAgo} minute${
          minutesAgo === 1 ? '' : 's'
        } ago`;
      } else if (secondsAgo < 86400) {
        timeStampText = `${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago`;
      } else if (daysAgo < 7) {
        timeStampText = `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`;
      } else if (daysAgo < 30) {
        timeStampText = `${weeksAgo} week${weeksAgo === 1 ? '' : 's'} ago`;
      } else if (monthsAgo < 12) {
        timeStampText = `${monthsAgo} month${monthsAgo === 1 ? '' : 's'} ago`;
      } else {
        timeStampText = `${yearsAgo} year${yearsAgo === 1 ? '' : 's'} ago`;
      }
      console.log(`${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`);

      jobListings.timeStamp = timeStampText;
    } else {
      console.error('jobListings is neither an array nor an object');
      throw new BadRequestException(
        'An error occured, if error persists contact Support',
      );
    }
  }
}
