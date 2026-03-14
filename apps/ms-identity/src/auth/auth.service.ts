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
    console.log('[AuthService] validateOAuthUser profile:', JSON.stringify(profile));
    const { email, displayName, id } = profile;

    let user = await this.usersRepository.findOne({ where: { email } });
    console.log('[AuthService] Existing user find result:', user ? 'User Found' : 'Not Found');

    if (!user) {
      console.log('[AuthService] Creating new user...');
      user = this.usersRepository.create({
        email,
        name: displayName,
        googleId: id,
        role: 'student', // Default role
      });
      await this.usersRepository.save(user);
      console.log('[AuthService] New user saved successfully with ID:', user.id);
    }

    console.log('[AuthService] Fetching tenants for user ID:', user.id);
    let tenants = await this.tenantsRepository.find({ where: { userId: user.id } });
    console.log('[AuthService] Tenants found:', tenants.length);

    if (tenants.length === 0) {
      console.log('[AuthService] No tenants found. Assigning default: franchise_alpha');
      const defaultTenant = this.tenantsRepository.create({
        userId: user.id,
        franchiseSchema: 'franchise_alpha',
        schoolId: '1', // Default school ID for dev
        role: 'owner',
      });
      await this.tenantsRepository.save(defaultTenant);
      tenants = [defaultTenant];
      console.log('[AuthService] Default tenant assigned and saved.');
    }

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
