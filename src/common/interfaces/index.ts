import { JwtPayload } from '@@/auth/payload/jwt.payload.interface';
import { Request } from 'express';

export enum USER_STATUS {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  SUSPENDED = 'Suspended',
}

export enum BILLINGCYCLE {
  MONTHLY = 'Monthly',
  QUARTERLY = 'Quarterly',
  YEARLY = 'Yearly',
}

export enum SKILLLEVEL {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
  EXPERT = 'Expert',
}

export enum LANGUAGE_PROFICIENCY {
  BASIC = 'Basic',
  CONVERSATIONAL = 'Conversational',
  PROFICIENT = 'Proficient',
  FLUENT = 'Fluent',
  NATIVE = 'Native',
}

export enum ROLE_TYPE {
  ADMIN = 'Admin',
  USER = 'User',
}

export enum API_TAGS {
  AUTH = 'Auth',
  JOBS = 'Jobs',
  ADMIN = 'Admin',
  HEALTH = 'Health Check',
  USER = 'User',
  PROFILE = 'User Profile',
  BLOGS = 'Blogs',
}

export enum Category {
  HYBRID = 'Hybrid',
  ONSITE = 'Onsite',
  REMOTE = 'Remote',
}

export enum JobType {
  FULLTIME = 'FullTime',
  PARTTIME = 'PartTime',
  CONTRACT = 'Contract',
  FREELANCE = 'Freelance',
  INTERNSHIP = 'Internship',
  TEMPORARY = 'Temporary',
}

export enum ExperienceLevel {
  JUNIOR = 'Junior',
  MIDLEVEL = 'MidLevel',
  SENIOR = 'Senior',
  ENTRYLEVEL = 'EntryLevel',
  INTERNSHIP = 'Internship',
  ASSOCIATE = 'Associate',
  PRINCIPAL = 'Principal',
}

export enum SORT_DIRECTION {
  DESC = 'desc',
  ASC = 'asc',
}

export enum ResourceType {
  Auto = 'auto',
  Image = 'image',
  Raw = 'raw',
  Video = 'video',
}

export enum JOB_LISTING_STATUS {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export enum AUTH_ERROR_MSGS {
  USER_NOT_FOUND = 'User not found',
  CREDENTIALS_DONT_MATCH = 'Crendentials do not match any of our records',
  INVALID_CREDENTIALS = 'Invalid Credentials',
  GOOGLE_LOGIN_ERROR = 'You signed up with Google. Please use Google login.',
  ALREADY_EXIST = 'User already exists, login',
  GOOGLE_ALREDY_EXISTS = 'User alreay exists, login with Google',
  PASSWORD_MATCH = 'Passwords do not match',
  GOOGLE_SIGNUP_ERROR = 'You You signed up with Google. Please use Google login.',
  GOOGLE_CHANGE_PASS_ERROR = `Google SignedUp user's cannot change password`,
  SUSPENDED_ACCOUNT_USER = 'Your account has been suspended. If you think this is a mistake, contact the admin',
  SUSPENDED_ACCOUNT_RESET_USER = `Your account has been suspended, therefore you can't request for a reset link. If you think this is a mistake, contact the admin`,
  SUSPENDED_ACCOUNT_ADMIN = 'Your admin account has been suspended. If you think this is a mistake, contact the root admin',
  SUSPENDED_ACCOUNT_RESET_ADMIN = `Your admin account has been suspended, therefore you can't request for a reset link. If you think this is a mistake, contact the root admin`,
  GOOGLE_CANNOT_RESET = 'Google signedUp users cannot reset password',
  FORBIDDEN = 'You cannot perform this action',
  EXPIRED_LINK = 'Link has expired',
  INVALID_OLD_PASSWORD = 'Invalid old password',
  SAME_PASSWORD_ERROR = 'New and old password cannot be the same',
}

export enum JOB_LISTING_ERROR {
  JOB_NOT_FOUND = 'Job Listing not found',
}

export enum BLOG_ERROR_MSGS {
  BLOG_NOT_FOUND = 'Blog not found',
}

export enum JOB_APPLICATION_ERORR {
  JOB_APPLICATION = 'Job Listing Application not found',
  NO_JOBS_FOUND = 'No Job Application found',
}

export enum DATA_NOT_FOUND {
  NOT_FOUND = 'Data not found',
}

export enum VALIDATION_ERROR_MSG {
  UPLOAD_ONE_FILE = 'At least one document (resume or cover letter) must be uploaded.',
  UPLOAD_BLOG_IMAGE = 'An image must be uploaded',
}

export enum ADMIN_ERROR_MSGS {}

export interface RequestWithUser extends Request {
  user: JwtPayload;
  permittedFields?: any;
  selectFields?: any;
}
