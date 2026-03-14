import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { FranchiseTenant } from '../tenants/entities/franchise-tenant.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(FranchiseTenant)
    private tenantsRepository: Repository<FranchiseTenant>,
    private jwtService: JwtService,
  ) {}

  async validateOAuthUser(profile: any): Promise<any> {
    const { email, displayName, id } = profile;

    let user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      this.logger.warn(`Forbidden login attempt: ${email} is not pre-registered.`);
      throw new UnauthorizedException('Usuário não convidado pela instituição');
    }

    // Phase 2: Activation/Update
    if (!user.googleId || !user.name) {
      await this.usersRepository.update(user.id, {
        googleId: id,
        name: displayName,
      });
      user = await this.usersRepository.findOne({ where: { id: user.id } }) as User;
    }

    const tenants = await this.tenantsRepository.find({ where: { userId: user.id } });

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role, // In identity, user has a role, but mappings also have roles. The PRD mentions both.
      tenants: tenants.map(t => ({
        schema: t.franchiseSchema,
        schoolId: t.schoolId,
        role: t.role,
      })),
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }

  async login(user: any) {
    const tenants = await this.tenantsRepository.find({ where: { userId: user.id } });
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenants: tenants.map(t => ({
        schema: t.franchiseSchema,
        schoolId: t.schoolId,
        role: t.role,
      })),
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
