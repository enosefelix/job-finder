export enum USER_STATUS {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  SIGNEDUP = 'SignedUp',
}

export enum BILLINGCYCLE {
  MONTHLY = 'Monthly',
  QUARTERLY = 'Quarterly',
  YEARLY = 'Yearly',
}

export enum SKILLLEVEL {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

export enum LANGUAGE_PROFICIENCY {
  BASIC = 'basic',
  CONVERSATIONAL = 'conversational',
  PROFICIENT = 'proficient',
  FLUENT = 'fluent',
  NATIVE = 'native',
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
}

export enum Category {
  HYBRID = 'Hybrid',
  ONSITE = 'Onsite',
  REMOTE = 'Remote',
}

export enum FAILED_LOGIN_MSG {
  CREDENTIALS_DONT_MATCH = 'Crendentials do not match any records',
  INVALID_CREDENTIALS = 'Invalid Credentials',
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
