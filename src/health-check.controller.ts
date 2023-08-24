import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { API_TAGS } from './common/interfaces';

@Controller('health')
export class HealthController {
  @ApiTags(API_TAGS.HEALTH)
  @Get()
  checkHealth() {
    return { status: 'ok' };
  }
}
