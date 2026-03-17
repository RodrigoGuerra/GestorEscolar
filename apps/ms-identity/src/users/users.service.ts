import { Injectable, Logger, ConflictException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { User } from './entities/user.entity';
import { FranchiseTenant } from '../tenants/entities/franchise-tenant.entity';
import { ProvisionUserDto } from './dto/provision-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(FranchiseTenant)
    private readonly tenantMappingsRepository: Repository<FranchiseTenant>,
    private readonly dataSource: DataSource,
    @Inject('IDENTITY_SERVICE') private readonly client: ClientProxy,
  ) {}

  async provision(dto: ProvisionUserDto): Promise<any> {
    const { email, role, schoolId, domainData } = dto;

    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create User (schema public)
      const user = this.usersRepository.create({
        email,
        role: role.toString(),
      });
      const savedUser = await queryRunner.manager.save(user);

      // 2. Create Tenant Mapping
      const tenantMapping = this.tenantMappingsRepository.create({
        userId: savedUser.id,
        franchiseSchema: dto.franchiseSchema,
        schoolId,
        role: role.toString(),
      });
      await queryRunner.manager.save(tenantMapping);

      await queryRunner.commitTransaction();

      // 3. Emit Event (PRD Payload: { user_id, email, role, school_id, domain_data })
      const payload = {
        user_id: savedUser.id,
        email,
        role,
        school_id: schoolId,
        domain_data: domainData,
      };

      this.client.emit('user.provisioned', payload);
      this.logger.log(`User provisioned: ${email}`);

      return {
        message: 'User provisioned successfully',
        userId: savedUser.id,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error provisioning user: ${err.message}`);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  // F19: accept only safe, user-editable fields via UpdateProfileDto — never Partial<User>
  async updateProfile(userId: string, updateData: UpdateProfileDto): Promise<User> {
    await this.usersRepository.update(userId, updateData);
    return this.usersRepository.findOne({ where: { id: userId } }) as Promise<User>;
  }
}
