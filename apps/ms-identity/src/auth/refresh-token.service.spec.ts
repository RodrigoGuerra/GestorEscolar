import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { RefreshTokenService } from './refresh-token.service';

// Mock ioredis before any import resolves it
const mockRedis = {
  set: jest.fn().mockResolvedValue('OK'),
  get: jest.fn(),
  getdel: jest.fn(),
  del: jest.fn().mockResolvedValue(1),
  on: jest.fn(),
  disconnect: jest.fn(),
};

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => mockRedis);
});

const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'REDIS_HOST') return 'localhost';
    if (key === 'REDIS_PORT') return 6379;
    return undefined;
  }),
};

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Re-initialise defaults after clearAllMocks() so every test starts clean.
    // clearAllMocks wipes implementations and return values on all jest.fn() instances,
    // including mockRedis.on and mockRedis.disconnect which are called during construction.
    mockRedis.set.mockResolvedValue('OK');
    mockRedis.del.mockResolvedValue(1);
    mockRedis.on.mockReturnValue(undefined);
    mockRedis.disconnect.mockReturnValue(undefined);
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'REDIS_HOST') return 'localhost';
      if (key === 'REDIS_PORT') return 6379;
      return undefined;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<RefreshTokenService>(RefreshTokenService);
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  describe('create', () => {
    it('should store a JSON payload in Redis with 30-day TTL and return an opaque token', async () => {
      const payload = { sub: 'user-1', email: 'a@b.com', role: 'teacher', tenants: [] };

      const token = await service.create(payload);

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(mockRedis.set).toHaveBeenCalledWith(
        `refresh:${token}`,
        JSON.stringify(payload),
        'EX',
        30 * 24 * 60 * 60,
      );
    });

    it('should generate a unique token on each call', async () => {
      const payload = { sub: 'u1' };
      const t1 = await service.create(payload);
      const t2 = await service.create(payload);
      expect(t1).not.toBe(t2);
    });
  });

  describe('validate', () => {
    it('should return the parsed payload for a valid token', async () => {
      const payload = { sub: 'u1', email: 'a@b.com' };
      mockRedis.get.mockResolvedValue(JSON.stringify(payload));

      const result = await service.validate('valid-token');

      expect(result).toEqual(payload);
      expect(mockRedis.get).toHaveBeenCalledWith('refresh:valid-token');
    });

    it('should throw UnauthorizedException when token does not exist in Redis', async () => {
      mockRedis.get.mockResolvedValue(null);

      await expect(service.validate('expired-token')).rejects.toThrow('Refresh token invalid or expired');
    });
  });

  describe('consume', () => {
    it('should atomically delete and return the payload for a valid token', async () => {
      const payload = { sub: 'u1', email: 'a@b.com' };
      mockRedis.getdel.mockResolvedValue(JSON.stringify(payload));

      const result = await service.consume('valid-token');

      expect(result).toEqual(payload);
      expect(mockRedis.getdel).toHaveBeenCalledWith('refresh:valid-token');
    });

    it('should throw UnauthorizedException when token is already consumed or expired', async () => {
      mockRedis.getdel.mockResolvedValue(null);

      await expect(service.consume('used-token')).rejects.toThrow('Refresh token invalid or expired');
    });
  });

  describe('revoke', () => {
    it('should delete the token from Redis', async () => {
      await service.revoke('some-token');

      expect(mockRedis.del).toHaveBeenCalledWith('refresh:some-token');
    });
  });
});
