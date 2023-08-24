import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache, CachingConfig } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async get<T = any>(key: string): Promise<T> {
    return this.cache.get(key);
  }

  async set(key: string, item: any, ttl?: number): Promise<any> {
    return this.cache.set(key, item, { ttl: ttl ? ttl : null });
  }

  async remove(key: string): Promise<any | any[]> {
    return this.cache.del(key);
  }

  async reset(): Promise<void> {
    return this.cache.reset();
  }

  async wrap(
    key: string,
    cb: (error: any, result: any) => any,
    config?: CachingConfig,
  ): Promise<any> {
    const data = await this.cache.wrap(key, cb, config);
    if (!!data && config?.ttl && typeof config.ttl === 'number') {
      this.set(key, data, config.ttl);
    }

    return data;
  }

  async wrap2(key: string, cb: () => Promise<any>): Promise<any> {
    return this.cache.wrap(key, cb);
  }
}
