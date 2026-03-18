import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { FranchiseTenant } from '../tenants/entities/franchise-tenant.entity';
import { School } from '../tenants/entities/school.entity';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(FranchiseTenant)
    private tenantsRepository: Repository<FranchiseTenant>,
    @InjectRepository(School)
    private schoolsRepository: Repository<School>,
    private jwtService: JwtService,
    // F24: refresh token support
    private refreshTokenService: RefreshTokenService,
  ) {}

  async validateOAuthUser(profile: any): Promise<any> {
    const { email, displayName, id } = profile;

    let user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      this.logger.warn(`Forbidden login attempt: ${email} is not pre-registered.`);
      throw new ForbiddenException('Usuário não convidado pela instituição');
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
    const schoolIds = tenants.map(t => t.schoolId);
    const schools = schoolIds.length > 0
      ? await this.schoolsRepository.findBy({ id: In(schoolIds) })
      : [];
    const schoolMap = new Map(schools.map(s => [s.id, s.name]));

    const jwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenants: tenants.map(t => ({
        schema: t.franchiseSchema,
        schoolId: t.schoolId,
        schoolName: schoolMap.get(t.schoolId) || t.schoolId,
        role: t.role,
      })),
    };

    // F24: issue short-lived access token (15m) + long-lived opaque refresh token (30d in Redis)
    const accessToken = this.jwtService.sign(jwtPayload);
    const refreshToken = await this.refreshTokenService.create(jwtPayload);

    return { accessToken, refreshToken, user };
  }

  /** F24/I2: validate and atomically consume the refresh token (GETDEL), then issue new pair. */
  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // consume() is atomic — closes TOCTOU window vs. validate()+revoke() sequence
    const payload = await this.refreshTokenService.consume(refreshToken);
    const newRefreshToken = await this.refreshTokenService.create(payload);
    const newAccessToken = this.jwtService.sign(payload);
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  /** F24: revoke the refresh token (logout). */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await this.refreshTokenService.revoke(refreshToken);
  }

}
