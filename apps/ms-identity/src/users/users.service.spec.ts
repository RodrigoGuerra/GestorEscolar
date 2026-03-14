import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { FranchiseTenant } from '../tenants/entities/franchise-tenant.entity';
import { DataSource } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { UserRole } from './dto/provision-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: any;
  let tenantRepository: any;
  let clientProxy: any;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockTenantRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockClientProxy = {
    emit: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn(),
      },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(FranchiseTenant), useValue: mockTenantRepository },
        { provide: DataSource, useValue: mockDataSource },
        { provide: 'IDENTITY_SERVICE', useValue: mockClientProxy },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
    tenantRepository = module.get(getRepositoryToken(FranchiseTenant));
    clientProxy = module.get('IDENTITY_SERVICE');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('provision', () => {
    it('should throw ConflictException if user already exists', async () => {
      userRepository.findOne.mockResolvedValue({ id: '1', email: 'test@example.com' });
      const dto = { email: 'test@example.com', role: UserRole.TEACHER, schoolId: 'uuid', franchiseSchema: 'schema1', domainData: {} };

      await expect(service.provision(dto)).rejects.toThrow(ConflictException);
    });

    it('should provision a new user and emit event', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue({ id: 'new-id', email: 'new@example.com' });
      mockDataSource.createQueryRunner().manager.save.mockResolvedValueOnce({ id: 'new-id', email: 'new@example.com' });
      tenantRepository.create.mockReturnValue({ id: 'mapping-id' });

      const dto = { email: 'new@example.com', role: UserRole.TEACHER, schoolId: 'uuid', franchiseSchema: 'schema1', domainData: { cpf: '123' } };
      const result = await service.provision(dto);

      expect(result).toEqual({ message: 'User provisioned successfully', userId: 'new-id' });
      expect(clientProxy.emit).toHaveBeenCalledWith('user.provisioned', expect.objectContaining({
        email: 'new@example.com',
        role: UserRole.TEACHER,
        user_id: 'new-id',
        school_id: 'uuid',
      }));
    });
  });
});
