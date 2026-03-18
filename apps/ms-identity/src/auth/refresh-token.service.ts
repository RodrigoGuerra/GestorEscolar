import { Injectable, Logger, OnModuleDestroy, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { randomBytes } from 'crypto';

const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
const KEY_PREFIX = 'refresh:';

@Injectable()
export class RefreshTokenService implements OnModuleDestroy {
  private readonly logger = new Logger(RefreshTokenService.name);
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST') || 'redis',
      port: this.configService.get<number>('REDIS_PORT') || 6379,
      // Retry with backoff so startup race vs Redis container doesn't crash the process
      retryStrategy: (times) => Math.min(times * 200, 5000),
      maxRetriesPerRequest: null,
      enableOfflineQueue: true,
      lazyConnect: false,
    });
    // Prevent unhandled 'error' events from crashing the process during startup
    this.redis.on('error', (err: Error) =>
      this.logger.warn(`Redis error: ${err.message}`)
    );
  }

  /** Generate a cryptographically random opaque token, store payload in Redis, return the token. */
  async create(payload: Record<string, any>): Promise<string> {
    const token = randomBytes(40).toString('hex');
    await this.redis.set(
      `${KEY_PREFIX}${token}`,
      JSON.stringify(payload),
      'EX',
      REFRESH_TTL_SECONDS,
    );
    return token;
  }

  /** Validate a refresh token — throws UnauthorizedException if missing or expired. */
  async validate(token: string): Promise<Record<string, any>> {
    const raw = await this.redis.get(`${KEY_PREFIX}${token}`);
    if (!raw) {
      throw new UnauthorizedException('Refresh token invalid or expired');
    }
    return JSON.parse(raw) as Record<string, any>;
  }

  /**
   * I2: Atomically consume a refresh token using GETDEL (Redis 6.2+).
   * Closes the TOCTOU window where two concurrent requests with the same token
   * could both pass validate() before either runs revoke().
   * Returns the payload if the token existed, throws if it was already consumed.
   */
  async consume(token: string): Promise<Record<string, any>> {
    const raw = await this.redis.getdel(`${KEY_PREFIX}${token}`);
    if (!raw) {
      throw new UnauthorizedException('Refresh token invalid or expired');
    }
    return JSON.parse(raw) as Record<string, any>;
  }

  /** Revoke a refresh token (logout). */
  async revoke(token: string): Promise<void> {
    await this.redis.del(`${KEY_PREFIX}${token}`);
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}
