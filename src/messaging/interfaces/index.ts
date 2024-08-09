import { User } from '@prisma/client';
import { SentMessageInfo } from 'nodemailer';

export const QUEUE = 'messaging:';

export enum TEMPLATE {
  RESET_MAIL_USER = 'reset-password-user',
  RESET_MAIL_ADMIN = 'reset-password-admin',
}

export enum JOBS {
  QUEUE_SMS = 'queueSms',
  QUEUE_EMAIL = 'queueEmail',
  QUEUE_RESET_TOKEN_EMAIL = 'queueResetTokenEmail',
  SEND_SMS = 'sendSms',
  SEND_EMAIL = 'sendEmail',
  DISPATCH_SEND_SMS = 'logRecipientSmsEntries',
  PROCESS_SMS_NOTIFICATION = 'processSmsNotification',
}

export interface ISmsMessageBinding {
  recipients: string[];
  message?: string;
  templateBindings?: Record<string, any>;
}

export interface IEmailMessageBinding {
  recipients: string[];
  body?: string;
  cc?: string[];
  bcc?: string[];
  templateBindings?: Record<string, any>;
}

export interface ISetUpTenantMessagingAccount {
  email: string;
  name: string;
}

export interface SendSmsOptions {
  recipients: string | string[];
  message: string;
  ref?: string;
}

export interface FileAttachmentOptions {
  filename: string;
  content: string;
  type?: string;
  disposition?: string;
}

export interface SendMailOptions {
  from?: string;
  ref?: string;
  subject?: string;
  to: string | string[];
  bcc?: string | string[];
  cc?: string | string[];
  body: string;
  attachments?: FileAttachmentOptions[];
}

export interface SmsProvider {
  sendSms(data: any): Promise<any>;
}

export interface MailProvider {
  sendMail(mail: SendMailOptions): Promise<SentMessageInfo>;
  id?: string;
}

export enum MailProviders {
  SendGrid = 'SendGrid',
  Smtp = 'Smtp',
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  authUser: string;
  authPassword: string;
}

export interface ISendEmail {
  user: User;
  templateName: TEMPLATE;
}

export interface SendGridConfig {
  apiKey: string;
}

export interface SMSGetBalanceResult {
  balance: number;
}

// ========= Job attributes ========

export interface ProcessSmsNotificationJobAttribs {
  body?: any;
  messageId?: string;
  plainBody?: string;
}

export interface SendMailJobAttribs extends SendMailOptions {
  messageId: string;
  tenantId: string;
}

export interface SendSmsJobAttribs extends SendSmsOptions {
  messageId?: string;
  tenantId: string;
}

export interface QueueSmsJobAttribs {
  messageId: string;
  tenantId: string;
}

export interface QueueMailJobAttribs {
  messageId: string;
  tenantId: string;
}
