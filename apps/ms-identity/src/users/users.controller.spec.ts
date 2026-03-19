import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { NotFoundException } from '@nestjs/common';
import { UserRole } from './dto/provision-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    provision: jest.fn(),
    findByEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('provision', () => {
    it('should call usersService.provision with the correct data', async () => {
      const dto = {
        email: 'test@example.com',
        role: UserRole.TEACHER,
        schoolId: 'school-1',
        franchiseSchema: 'schema-1',
      };
      const expectedResult = { id: 'user-1', ...dto };
      mockUsersService.provision.mockResolvedValue(expectedResult);

      const result = await controller.provision(dto);

      expect(service.provision).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      const email = 'test@example.com';
      const expectedUser = { id: 'user-1', email };
      mockUsersService.findByEmail.mockResolvedValue(expectedUser);

      const result = await controller.findByEmail(email);

      expect(service.findByEmail).toHaveBeenCalledWith(email);
      expect(result).toEqual(expectedUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      const email = 'notfound@example.com';
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(controller.findByEmail(email)).rejects.toThrow(NotFoundException);
    });
  });
});
