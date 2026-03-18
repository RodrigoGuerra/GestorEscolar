import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { RefreshTokenService } from './refresh-token.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { FranchiseTenant } from '../tenants/entities/franchise-tenant.entity';
import { School } from '../tenants/entities/school.entity';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: any;
  let tenantRepository: any;
  let schoolRepository: any;
  let refreshTokenService: any;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockTenantRepository = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockSchoolRepository = {
    findBy: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-access-token'),
  };

  const mockRefreshTokenService = {
    create: jest.fn().mockResolvedValue('mock-refresh-token'),
    consume: jest.fn(),
    revoke: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockJwtService.sign.mockReturnValue('mock-access-token');
    mockRefreshTokenService.create.mockResolvedValue('mock-refresh-token');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(FranchiseTenant), useValue: mockTenantRepository },
        { provide: getRepositoryToken(School), useValue: mockSchoolRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: RefreshTokenService, useValue: mockRefreshTokenService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    tenantRepository = module.get(getRepositoryToken(FranchiseTenant));
    schoolRepository = module.get(getRepositoryToken(School));
    refreshTokenService = module.get(RefreshTokenService);
  });

  describe('validateOAuthUser', () => {
    it('should throw ForbiddenException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const profile = { email: 'unknown@example.com', displayName: 'Unknown', id: 'google-id' };

      await expect(service.validateOAuthUser(profile)).rejects.toThrow(ForbiddenException);
    });

    it('should update and activate a pre-registered user', async () => {
      const preRegisteredUser = { id: 'user-id', email: 'test@example.com', googleId: null, name: null, role: 'teacher' };
      const activatedUser = { ...preRegisteredUser, googleId: 'google-id', name: 'Test User' };
      userRepository.findOne
        .mockResolvedValueOnce(preRegisteredUser)
        .mockResolvedValueOnce(activatedUser);
      tenantRepository.find.mockResolvedValue([{ franchiseSchema: 'schema1', schoolId: 'school1', role: 'teacher' }]);
      schoolRepository.findBy.mockResolvedValue([{ id: 'school1', name: 'School One' }]);

      const profile = { email: 'test@example.com', displayName: 'Test User', id: 'google-id' };
      const result = await service.validateOAuthUser(profile);

      expect(userRepository.update).toHaveBeenCalledWith('user-id', { googleId: 'google-id', name: 'Test User' });
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.user.name).toBe('Test User');
    });

    it('should not update if user is already activated', async () => {
      const activeUser = { id: 'user-id', email: 'test@example.com', googleId: 'google-id', name: 'Test User', role: 'teacher' };
      userRepository.findOne.mockResolvedValue(activeUser);
      tenantRepository.find.mockResolvedValue([]);
      schoolRepository.findBy.mockResolvedValue([]);

      const profile = { email: 'test@example.com', displayName: 'Test User', id: 'google-id' };
      await service.validateOAuthUser(profile);

      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('should include school names in JWT payload tenants', async () => {
      const user = { id: 'u1', email: 'a@b.com', googleId: 'g1', name: 'Alice', role: 'teacher' };
      userRepository.findOne.mockResolvedValue(user);
      tenantRepository.find.mockResolvedValue([{ franchiseSchema: 'schema1', schoolId: 'school-uuid', role: 'teacher' }]);
      schoolRepository.findBy.mockResolvedValue([{ id: 'school-uuid', name: 'Escola Alfa' }]);

      await service.validateOAuthUser({ email: 'a@b.com', displayName: 'Alice', id: 'g1' });

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          tenants: expect.arrayContaining([
            expect.objectContaining({ schoolName: 'Escola Alfa' }),
          ]),
        }),
      );
    });
  });

  describe('refreshAccessToken', () => {
    it('should consume the refresh token and return a new token pair', async () => {
      const payload = { sub: 'u1', email: 'a@b.com', role: 'teacher', tenants: [] };
      mockRefreshTokenService.consume.mockResolvedValue(payload);
      mockRefreshTokenService.create.mockResolvedValue('new-refresh-token');
      mockJwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refreshAccessToken('old-refresh-token');

      expect(refreshTokenService.consume).toHaveBeenCalledWith('old-refresh-token');
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should propagate UnauthorizedException when token is invalid', async () => {
      mockRefreshTokenService.consume.mockRejectedValue(new UnauthorizedException());

      await expect(service.refreshAccessToken('bad-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('revokeRefreshToken', () => {
    it('should delegate to RefreshTokenService.revoke', async () => {
      mockRefreshTokenService.revoke.mockResolvedValue(undefined);

      await service.revokeRefreshToken('some-token');

      expect(refreshTokenService.revoke).toHaveBeenCalledWith('some-token');
    });
  });

});
