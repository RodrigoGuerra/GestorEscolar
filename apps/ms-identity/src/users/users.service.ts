import { Injectable, Logger, ConflictException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { User } from './entities/user.entity';
import { FranchiseTenant } from '../tenants/entities/franchise-tenant.entity';
import { ProvisionUserDto } from './dto/provision-user.dto';

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
        role: role.toString(), // Default role from DTO
      });
      const savedUser = await queryRunner.manager.save(user);

      // 2. Create Tenant Mapping
      // In a real scenario, we might need to derive franchise_schema from schoolId or other data.
      // For now, we'll assume a default or pass it in domainData/derive it.
      // The PRD says it links to franchise_schema.
      const tenantMapping = this.tenantMappingsRepository.create({
        userId: savedUser.id,
        franchiseSchema: 'tenant_default', // Placeholder, should be dynamic
        schoolId,
        role: role.toString(),
      });
      await queryRunner.manager.save(tenantMapping);

      await queryRunner.commitTransaction();

      // 3. Emit Event
      const payload = {
        userId: savedUser.id,
        email,
        role,
        schoolId,
        domainData,
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

  async updateProfile(userId: string, updateData: Partial<User>): Promise<User> {
    await this.usersRepository.update(userId, updateData);
    return this.usersRepository.findOne({ where: { id: userId } }) as Promise<User>;
  }
}
