import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { FranchiseTenant } from '../tenants/entities/franchise-tenant.entity';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: any;
  let tenantRepository: any;

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

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(FranchiseTenant), useValue: mockTenantRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    tenantRepository = module.get(getRepositoryToken(FranchiseTenant));
  });

  it('should throw UnauthorizedException if user not found', async () => {
    userRepository.findOne.mockResolvedValue(null);
    const profile = { email: 'unknown@example.com', displayName: 'Unknown', id: 'google-id' };

    await expect(service.validateOAuthUser(profile)).rejects.toThrow(UnauthorizedException);
  });

  it('should update and activate a pre-registered user', async () => {
    const preRegisteredUser = { id: 'user-id', email: 'test@example.com', googleId: null, name: null, role: 'teacher' };
    userRepository.findOne.mockResolvedValueOnce(preRegisteredUser);
    userRepository.findOne.mockResolvedValueOnce({ ...preRegisteredUser, googleId: 'google-id', name: 'Test User' });
    tenantRepository.find.mockResolvedValue([{ franchiseSchema: 'schema1', schoolId: 'school1', role: 'teacher' }]);

    const profile = { email: 'test@example.com', displayName: 'Test User', id: 'google-id' };
    const result = await service.validateOAuthUser(profile);

    expect(userRepository.update).toHaveBeenCalledWith('user-id', { googleId: 'google-id', name: 'Test User' });
    expect(result.accessToken).toBe('mock-token');
    expect(result.user.name).toBe('Test User');
  });

  it('should not update if user is already activated', async () => {
    const activeUser = { id: 'user-id', email: 'test@example.com', googleId: 'google-id', name: 'Test User', role: 'teacher' };
    userRepository.findOne.mockResolvedValue(activeUser);
    tenantRepository.find.mockResolvedValue([]);

    const profile = { email: 'test@example.com', displayName: 'Test User', id: 'google-id' };
    await service.validateOAuthUser(profile);

    expect(userRepository.update).not.toHaveBeenCalled();
  });
});
