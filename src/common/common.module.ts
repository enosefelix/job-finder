import { Module } from '@nestjs/common';
import { CacheService } from './cache/cache.service';

@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CommonModule {}
