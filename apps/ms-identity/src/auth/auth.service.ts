import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { FranchiseTenant } from '../tenants/entities/franchise-tenant.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(FranchiseTenant)
    private tenantsRepository: Repository<FranchiseTenant>,
    private jwtService: JwtService,
  ) {}

  async validateOAuthUser(profile: any): Promise<any> {
    const { emails, displayName, id } = profile;
    const email = emails[0].value;

    let user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      user = this.usersRepository.create({
        email,
        name: displayName,
        googleId: id,
        role: 'student', // Default role
      });
      await this.usersRepository.save(user);
    }

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
