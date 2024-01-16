import { MessageTemplate } from '@prisma/client';
import { SendMailOptions, SendSmsOptions } from '../interfaces';
import Handlebars from 'handlebars';

export abstract class MessageBuilder {
  protected recipients: string[];
  protected body: string;
  protected bindings: Record<string, any>;
  protected template: MessageTemplate;

  protected abstract build(): SendSmsOptions | SendMailOptions;

  getRecipients() {
    return this.recipients;
  }

  getBody() {
    return this.body;
  }

  getBindings() {
    return this.bindings;
  }

  getTemplate() {
    return this.template;
  }

  addRecipients(recipients: string | string[]): this {
    if (typeof recipients === 'string') {
      recipients = [recipients];
    }
    this.recipients = recipients;
    return this;
  }

  addBody(body: string) {
    this.body = body;
    return this;
  }

  useTemplate(template: MessageTemplate, bindings: Record<string, any> = {}) {
    this.template = template;
    this.bindings = bindings;
    return this;
  }

  public static compileTemplate<T>(template: string, data: T) {
    const templateDelegateFn = Handlebars.compile(template);
    return templateDelegateFn(data);
  }
}
