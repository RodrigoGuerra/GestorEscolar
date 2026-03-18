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
  let clientProxy: any;

  const mockQueryRunnerManager = { save: jest.fn() };
  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: mockQueryRunnerManager,
  };

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
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    // clearAllMocks wipes all jest.fn() implementations. Re-attach createQueryRunner's
    // return value. Note: individual methods on mockQueryRunner (connect, startTransaction,
    // commitTransaction, rollbackTransaction, release) and mockQueryRunnerManager.save
    // are also cleared — each test that uses them MUST set them up within the `it` body.
    mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);

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
      expect(mockQueryRunner.startTransaction).not.toHaveBeenCalled();
    });

    it('should provision a new user and emit event', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const savedUser = { id: 'new-id', email: 'new@example.com' };
      userRepository.create.mockReturnValue(savedUser);
      mockTenantRepository.create.mockReturnValue({ id: 'mapping-id' });
      mockQueryRunnerManager.save
        .mockResolvedValueOnce(savedUser)
        .mockResolvedValueOnce({ id: 'mapping-id' });

      const dto = { email: 'new@example.com', role: UserRole.TEACHER, schoolId: 'uuid', franchiseSchema: 'schema1', domainData: { cpf: '123' } };
      const result = await service.provision(dto);

      expect(result).toEqual({ message: 'User provisioned successfully', userId: 'new-id' });
      expect(clientProxy.emit).toHaveBeenCalledWith('user.provisioned', expect.objectContaining({
        email: 'new@example.com',
        role: UserRole.TEACHER,
        user_id: 'new-id',
        school_id: 'uuid',
      }));
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue({ id: 'x', email: 'x@example.com' });
      mockQueryRunnerManager.save.mockRejectedValue(new Error('DB error'));

      const dto = { email: 'x@example.com', role: UserRole.TEACHER, schoolId: 'uuid', franchiseSchema: 'schema1', domainData: {} };

      await expect(service.provision(dto)).rejects.toThrow('DB error');
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('should return the user when found', async () => {
      const user = { id: 'u1', email: 'found@example.com' };
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('found@example.com');

      expect(result).toEqual(user);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: 'found@example.com' } });
    });

    it('should return null when user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update and return the updated user', async () => {
      const updatedUser = { id: 'u1', email: 'a@b.com', name: 'New Name' };
      userRepository.update.mockResolvedValue({ affected: 1 });
      userRepository.findOne.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('u1', { name: 'New Name' });

      expect(userRepository.update).toHaveBeenCalledWith('u1', { name: 'New Name' });
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 'u1' } });
      expect(result).toEqual(updatedUser);
    });
  });
});
