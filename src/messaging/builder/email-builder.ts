import { AppUtilities } from '@@/app.utilities';
import { NotAcceptableException } from '@nestjs/common';
import { compile } from 'handlebars';
import { SendMailOptions } from '../interfaces';
import { MessageBuilder } from './message-builder';

export class EmailBuilder extends MessageBuilder {
  private subject: string;
  private fromAddress: string;
  private fromAddressName?: string;
  private files: any[];
  private bcc: string[];
  private cc: string[];

  getFiles() {
    return this.files;
  }

  getSubject() {
    return this.subject;
  }

  addFrom(address: string, name?: string) {
    this.fromAddress = address;
    this.fromAddressName = name;
  }

  addFiles(files: any[]): this {
    this.files = files;
    return this;
  }

  addSubject(subject: string): this {
    this.subject = subject;
    return this;
  }

  addCc(cc: string[]): this {
    this.cc = cc;
    return this;
  }

  addBcc(bcc: string[]): this {
    this.bcc = bcc;
    return this;
  }

  build(): SendMailOptions {
    if (this.template && this.template.type === 'Email') {
      this.bindTemplate();
    } else if (!this.body) {
      throw new NotAcceptableException('Invalid email body!');
    } else if (!this.recipients.length) {
      throw new NotAcceptableException('No recipients!');
    }

    return {
      from: `${this.fromAddressName} <${this.fromAddress}>`,
      to: this.recipients,
      subject: this.subject,
      body: this.body,
      attachments: this.files,
      bcc: this.bcc,
      cc: this.cc,
    };
  }

  private bindTemplate() {
    const templateFn = compile(AppUtilities.decode(this.template.body));
    this.body = templateFn(this.bindings);
    this.subject = this.subject || this.template.subject;
  }
}
