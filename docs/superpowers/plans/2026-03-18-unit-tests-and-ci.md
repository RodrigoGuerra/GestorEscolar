# Unit Tests Revision & GitHub Actions CI Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix broken unit tests, add meaningful service-level unit tests for ms-identity and ms-academic, and create a GitHub Actions CI pipeline for lint, tests, and build.

**Architecture:** Each microservice runs Jest with ts-jest. Tests mock all external dependencies (TypeORM repositories, Redis, JwtService). CI uses Turbo to orchestrate lint/test/build across all workspaces in parallel.

**Tech Stack:** NestJS 11, Jest 30, ts-jest, TypeScript 5.7, Turbo, GitHub Actions, Node 20 LTS

---

## Background: What Is Broken Today

- `auth.service.spec.ts` — **will not compile**: `AuthService` now requires `School` repository and `RefreshTokenService` but neither is mocked in the test module.
- `users.service.spec.ts` — missing `jest.clearAllMocks()` in `beforeEach`; tests for `findByEmail` and `updateProfile` are absent.
- ms-academic, ms-hr, ms-finance, ms-notification — only have stub `AppController` "Hello World" tests; `GradesService` and `StudentsService` have zero coverage.
- No CI pipeline exists (no `.github/workflows/` directory).

---

## File Map

| Action   | File                                                              | Responsibility                                      |
|----------|-------------------------------------------------------------------|-----------------------------------------------------|
| Modify   | `apps/ms-identity/src/auth/auth.service.spec.ts`                  | Fix broken mocks; add tests for refreshAccessToken, revokeRefreshToken, login |
| Create   | `apps/ms-identity/src/auth/refresh-token.service.spec.ts`         | Unit-test Redis-backed refresh token logic          |
| Modify   | `apps/ms-identity/src/users/users.service.spec.ts`                | Add clearAllMocks; add findByEmail & updateProfile tests |
| Create   | `apps/ms-academic/src/grades/grades.service.spec.ts`              | Unit-test GradesService via mocked TenantRepositoryService |
| Create   | `apps/ms-academic/src/students/students.service.spec.ts`          | Unit-test StudentsService via mocked TenantRepositoryService |
| Create   | `.github/workflows/ci.yml`                                        | CI: lint, test, build for all workspaces            |

---

## Task 1: Fix `auth.service.spec.ts`

**Files:**
- Modify: `apps/ms-identity/src/auth/auth.service.spec.ts`

The current test is missing mocks for `School` repository and `RefreshTokenService`, so `Test.createTestingModule().compile()` throws. We also add tests for the three new methods.

- [ ] **Step 1: Read the current file and confirm what's missing**

  Run: `cat apps/ms-identity/src/auth/auth.service.spec.ts`

  Confirm constructors in `auth.service.ts` need: `User` repo, `FranchiseTenant` repo, `School` repo, `JwtService`, `RefreshTokenService`.

- [ ] **Step 2: Replace the entire file with the fixed version**

  `apps/ms-identity/src/auth/auth.service.spec.ts`:

  ```typescript
  import { Test, TestingModule } from '@nestjs/testing';
  import { AuthService } from './auth.service';
  import { RefreshTokenService } from './refresh-token.service';
  import { JwtService } from '@nestjs/jwt';
  import { getRepositoryToken } from '@nestjs/typeorm';
  import { User } from '../users/entities/user.entity';
  import { FranchiseTenant } from '../tenants/entities/franchise-tenant.entity';
  import { School } from '../tenants/entities/school.entity';
  import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

  describe('AuthService', () => {
    let service: AuthService;
    let userRepository: any;
    let tenantRepository: any;
    let schoolRepository: any;
    let refreshTokenService: any;

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

    const mockSchoolRepository = {
      findByIds: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-access-token'),
    };

    const mockRefreshTokenService = {
      create: jest.fn().mockResolvedValue('mock-refresh-token'),
      consume: jest.fn(),
      revoke: jest.fn(),
    };

    beforeEach(async () => {
      jest.clearAllMocks();
      mockJwtService.sign.mockReturnValue('mock-access-token');
      mockRefreshTokenService.create.mockResolvedValue('mock-refresh-token');

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          { provide: getRepositoryToken(User), useValue: mockUserRepository },
          { provide: getRepositoryToken(FranchiseTenant), useValue: mockTenantRepository },
          { provide: getRepositoryToken(School), useValue: mockSchoolRepository },
          { provide: JwtService, useValue: mockJwtService },
          { provide: RefreshTokenService, useValue: mockRefreshTokenService },
        ],
      }).compile();

      service = module.get<AuthService>(AuthService);
      userRepository = module.get(getRepositoryToken(User));
      tenantRepository = module.get(getRepositoryToken(FranchiseTenant));
      schoolRepository = module.get(getRepositoryToken(School));
      refreshTokenService = module.get(RefreshTokenService);
    });

    describe('validateOAuthUser', () => {
      it('should throw ForbiddenException if user not found', async () => {
        userRepository.findOne.mockResolvedValue(null);
        const profile = { email: 'unknown@example.com', displayName: 'Unknown', id: 'google-id' };

        await expect(service.validateOAuthUser(profile)).rejects.toThrow(ForbiddenException);
      });

      it('should update and activate a pre-registered user', async () => {
        const preRegisteredUser = { id: 'user-id', email: 'test@example.com', googleId: null, name: null, role: 'teacher' };
        const activatedUser = { ...preRegisteredUser, googleId: 'google-id', name: 'Test User' };
        userRepository.findOne
          .mockResolvedValueOnce(preRegisteredUser)
          .mockResolvedValueOnce(activatedUser);
        tenantRepository.find.mockResolvedValue([{ franchiseSchema: 'schema1', schoolId: 'school1', role: 'teacher' }]);
        schoolRepository.findByIds.mockResolvedValue([{ id: 'school1', name: 'School One' }]);

        const profile = { email: 'test@example.com', displayName: 'Test User', id: 'google-id' };
        const result = await service.validateOAuthUser(profile);

        expect(userRepository.update).toHaveBeenCalledWith('user-id', { googleId: 'google-id', name: 'Test User' });
        expect(result.accessToken).toBe('mock-access-token');
        expect(result.refreshToken).toBe('mock-refresh-token');
      });

      it('should not update if user is already activated', async () => {
        const activeUser = { id: 'user-id', email: 'test@example.com', googleId: 'google-id', name: 'Test User', role: 'teacher' };
        userRepository.findOne.mockResolvedValue(activeUser);
        tenantRepository.find.mockResolvedValue([]);
        schoolRepository.findByIds.mockResolvedValue([]);

        const profile = { email: 'test@example.com', displayName: 'Test User', id: 'google-id' };
        await service.validateOAuthUser(profile);

        expect(userRepository.update).not.toHaveBeenCalled();
      });

      it('should include school names in JWT payload tenants', async () => {
        const user = { id: 'u1', email: 'a@b.com', googleId: 'g1', name: 'Alice', role: 'teacher' };
        userRepository.findOne.mockResolvedValue(user);
        tenantRepository.find.mockResolvedValue([{ franchiseSchema: 'schema1', schoolId: 'school-uuid', role: 'teacher' }]);
        schoolRepository.findByIds.mockResolvedValue([{ id: 'school-uuid', name: 'Escola Alfa' }]);

        await service.validateOAuthUser({ email: 'a@b.com', displayName: 'Alice', id: 'g1' });

        expect(mockJwtService.sign).toHaveBeenCalledWith(
          expect.objectContaining({
            tenants: expect.arrayContaining([
              expect.objectContaining({ schoolName: 'Escola Alfa' }),
            ]),
          }),
        );
      });
    });

    describe('refreshAccessToken', () => {
      it('should consume the refresh token and return a new token pair', async () => {
        const payload = { sub: 'u1', email: 'a@b.com', role: 'teacher', tenants: [] };
        mockRefreshTokenService.consume.mockResolvedValue(payload);
        mockRefreshTokenService.create.mockResolvedValue('new-refresh-token');
        mockJwtService.sign.mockReturnValue('new-access-token');

        const result = await service.refreshAccessToken('old-refresh-token');

        expect(refreshTokenService.consume).toHaveBeenCalledWith('old-refresh-token');
        expect(result.accessToken).toBe('new-access-token');
        expect(result.refreshToken).toBe('new-refresh-token');
      });

      it('should propagate UnauthorizedException when token is invalid', async () => {
        mockRefreshTokenService.consume.mockRejectedValue(new UnauthorizedException());

        await expect(service.refreshAccessToken('bad-token')).rejects.toThrow(UnauthorizedException);
      });
    });

    describe('revokeRefreshToken', () => {
      it('should delegate to RefreshTokenService.revoke', async () => {
        mockRefreshTokenService.revoke.mockResolvedValue(undefined);

        await service.revokeRefreshToken('some-token');

        expect(refreshTokenService.revoke).toHaveBeenCalledWith('some-token');
      });
    });

    describe('login', () => {
      it('should return an access_token with tenant info', async () => {
        const user = { id: 'u1', email: 'a@b.com', role: 'admin' };
        tenantRepository.find.mockResolvedValue([{ franchiseSchema: 'schema1', schoolId: 's1', role: 'admin' }]);
        schoolRepository.findByIds.mockResolvedValue([{ id: 's1', name: 'School S1' }]);
        mockJwtService.sign.mockReturnValue('login-token');

        const result = await service.login(user);

        expect(result.access_token).toBe('login-token');
        expect(mockJwtService.sign).toHaveBeenCalledWith(
          expect.objectContaining({ sub: 'u1', email: 'a@b.com' }),
        );
      });
    });
  });
  ```

- [ ] **Step 3: Run the tests and verify they pass**

  ```bash
  cd apps/ms-identity && npx jest --testPathPattern="auth.service.spec" --no-coverage 2>&1 | tail -20
  ```

  Expected: `Tests: X passed`

- [ ] **Step 4: Commit**

  ```bash
  git add apps/ms-identity/src/auth/auth.service.spec.ts
  git commit -m "fix(ms-identity): update auth.service.spec with School repo and RefreshTokenService mocks"
  ```

---

## Task 2: Add `refresh-token.service.spec.ts`

**Files:**
- Create: `apps/ms-identity/src/auth/refresh-token.service.spec.ts`

`RefreshTokenService` creates a `new Redis(...)` in its constructor. We mock the `ioredis` module so no real Redis connection is made.

- [ ] **Step 1: Write the test file**

  `apps/ms-identity/src/auth/refresh-token.service.spec.ts`:

  ```typescript
  import { Test, TestingModule } from '@nestjs/testing';
  import { ConfigService } from '@nestjs/config';
  import { UnauthorizedException } from '@nestjs/common';
  import { RefreshTokenService } from './refresh-token.service';

  // Mock ioredis before any import resolves it
  const mockRedis = {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn(),
    getdel: jest.fn(),
    del: jest.fn().mockResolvedValue(1),
    on: jest.fn(),
    disconnect: jest.fn(),
  };

  jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => mockRedis);
  });

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'REDIS_HOST') return 'localhost';
      if (key === 'REDIS_PORT') return 6379;
      return undefined;
    }),
  };

  describe('RefreshTokenService', () => {
    let service: RefreshTokenService;

    beforeEach(async () => {
      jest.clearAllMocks();
      // Re-initialise defaults after clearAllMocks() so every test starts clean.
      // clearAllMocks wipes implementations and return values on all jest.fn() instances,
      // including mockRedis.on and mockRedis.disconnect which are called during construction.
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.del.mockResolvedValue(1);
      mockRedis.on.mockReturnValue(undefined);
      mockRedis.disconnect.mockReturnValue(undefined);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RefreshTokenService,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      service = module.get<RefreshTokenService>(RefreshTokenService);
    });

    afterEach(() => {
      service.onModuleDestroy();
    });

    describe('create', () => {
      it('should store a JSON payload in Redis with 30-day TTL and return an opaque token', async () => {
        const payload = { sub: 'user-1', email: 'a@b.com', role: 'teacher', tenants: [] };

        const token = await service.create(payload);

        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(0);
        expect(mockRedis.set).toHaveBeenCalledWith(
          `refresh:${token}`,
          JSON.stringify(payload),
          'EX',
          30 * 24 * 60 * 60,
        );
      });

      it('should generate a unique token on each call', async () => {
        const payload = { sub: 'u1' };
        const t1 = await service.create(payload);
        const t2 = await service.create(payload);
        expect(t1).not.toBe(t2);
      });
    });

    describe('validate', () => {
      it('should return the parsed payload for a valid token', async () => {
        const payload = { sub: 'u1', email: 'a@b.com' };
        mockRedis.get.mockResolvedValue(JSON.stringify(payload));

        const result = await service.validate('valid-token');

        expect(result).toEqual(payload);
        expect(mockRedis.get).toHaveBeenCalledWith('refresh:valid-token');
      });

      it('should throw UnauthorizedException when token does not exist in Redis', async () => {
        mockRedis.get.mockResolvedValue(null);

        await expect(service.validate('expired-token')).rejects.toThrow(UnauthorizedException);
      });
    });

    describe('consume', () => {
      it('should atomically delete and return the payload for a valid token', async () => {
        const payload = { sub: 'u1', email: 'a@b.com' };
        mockRedis.getdel.mockResolvedValue(JSON.stringify(payload));

        const result = await service.consume('valid-token');

        expect(result).toEqual(payload);
        expect(mockRedis.getdel).toHaveBeenCalledWith('refresh:valid-token');
      });

      it('should throw UnauthorizedException when token is already consumed or expired', async () => {
        mockRedis.getdel.mockResolvedValue(null);

        await expect(service.consume('used-token')).rejects.toThrow(UnauthorizedException);
      });
    });

    describe('revoke', () => {
      it('should delete the token from Redis', async () => {
        await service.revoke('some-token');

        expect(mockRedis.del).toHaveBeenCalledWith('refresh:some-token');
      });
    });
  });
  ```

- [ ] **Step 2: Run the tests and verify they pass**

  ```bash
  cd apps/ms-identity && npx jest --testPathPattern="refresh-token.service.spec" --no-coverage 2>&1 | tail -20
  ```

  Expected: `Tests: X passed`

- [ ] **Step 3: Commit**

  ```bash
  git add apps/ms-identity/src/auth/refresh-token.service.spec.ts
  git commit -m "test(ms-identity): add unit tests for RefreshTokenService with mocked ioredis"
  ```

---

## Task 3: Fix `users.service.spec.ts`

**Files:**
- Modify: `apps/ms-identity/src/users/users.service.spec.ts`

Add `jest.clearAllMocks()` in `beforeEach` to prevent state leak, and add tests for `findByEmail` and `updateProfile`.

- [ ] **Step 1: Write the updated file**

  `apps/ms-identity/src/users/users.service.spec.ts`:

  ```typescript
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
          .mockResolvedValueOnce(savedUser)    // user save
          .mockResolvedValueOnce({ id: 'mapping-id' }); // tenant save

        const dto = { email: 'new@example.com', role: UserRole.TEACHER, schoolId: 'uuid', franchiseSchema: 'schema1', domainData: { cpf: '123' } };
        const result = await service.provision(dto);

        expect(result).toEqual({ message: 'User provisioned successfully', userId: 'new-id' });
        expect(clientProxy.emit).toHaveBeenCalledWith('user.provisioned', expect.objectContaining({
          email: 'new@example.com',
          role: UserRole.TEACHER,
          user_id: 'new-id',
          school_id: 'uuid',
        }));
        expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        expect(mockQueryRunner.release).toHaveBeenCalled();
      });

      it('should rollback transaction on error', async () => {
        userRepository.findOne.mockResolvedValue(null);
        userRepository.create.mockReturnValue({ id: 'x', email: 'x@example.com' });
        mockQueryRunnerManager.save.mockRejectedValue(new Error('DB error'));

        const dto = { email: 'x@example.com', role: UserRole.TEACHER, schoolId: 'uuid', franchiseSchema: 'schema1', domainData: {} };

        await expect(service.provision(dto)).rejects.toThrow('DB error');
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
        expect(result).toEqual(updatedUser);
      });
    });
  });
  ```

- [ ] **Step 2: Run the tests and verify they pass**

  ```bash
  cd apps/ms-identity && npx jest --testPathPattern="users.service.spec" --no-coverage 2>&1 | tail -20
  ```

  Expected: `Tests: X passed`

- [ ] **Step 3: Commit**

  ```bash
  git add apps/ms-identity/src/users/users.service.spec.ts
  git commit -m "test(ms-identity): fix users.service.spec - add clearAllMocks and tests for findByEmail and updateProfile"
  ```

---

## Task 4: Add `grades.service.spec.ts` for ms-academic

**Files:**
- Create: `apps/ms-academic/src/grades/grades.service.spec.ts`

`GradesService` delegates all DB operations to `TenantRepositoryService.getRepository()`. We mock the entire `TenantRepositoryService` and the repository it returns.

> **Scope note:** `TenantRepositoryService` is `@Injectable({ scope: Scope.REQUEST })`. When provided via `useValue` in the test module, NestJS treats the provider as DEFAULT-scoped (a plain object has no scope metadata), breaking the transitive request-scope chain. This means `module.get<GradesService>(GradesService)` works correctly. If you see a `Cannot get instance of a request-scoped provider` error, fall back to `await module.resolve<GradesService>(GradesService)` instead.

- [ ] **Step 1: Write the test file**

  `apps/ms-academic/src/grades/grades.service.spec.ts`:

  ```typescript
  import { Test, TestingModule } from '@nestjs/testing';
  import { NotFoundException } from '@nestjs/common';
  import { GradesService } from './grades.service';
  import { TenantRepositoryService } from '../common/tenant/tenant-repository.service';
  import { Grade } from './entities/grade.entity';

  describe('GradesService', () => {
    let service: GradesService;
    let mockRepo: any;

    const mockGrade = { id: 'g1', value: 9.5, subject: { id: 's1', name: 'Math' } };

    beforeEach(async () => {
      mockRepo = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
      };

      const mockTenantRepo = {
        getRepository: jest.fn().mockReturnValue(mockRepo),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          GradesService,
          { provide: TenantRepositoryService, useValue: mockTenantRepo },
        ],
      }).compile();

      service = module.get<GradesService>(GradesService);
    });

    describe('create', () => {
      it('should create and save a grade', async () => {
        const dto = { value: 9.5, subjectId: 's1' };
        const created = { ...dto, id: 'g1' };
        mockRepo.create.mockReturnValue(created);
        mockRepo.save.mockResolvedValue(created);

        const result = await service.create(dto as any);

        expect(mockRepo.create).toHaveBeenCalledWith(dto);
        expect(mockRepo.save).toHaveBeenCalledWith(created);
        expect(result).toEqual(created);
      });
    });

    describe('findAll', () => {
      it('should return all grades with subject relation', async () => {
        mockRepo.find.mockResolvedValue([mockGrade]);

        const result = await service.findAll();

        expect(mockRepo.find).toHaveBeenCalledWith({ relations: ['subject'] });
        expect(result).toEqual([mockGrade]);
      });
    });

    describe('findOne', () => {
      it('should return the grade when found', async () => {
        mockRepo.findOne.mockResolvedValue(mockGrade);

        const result = await service.findOne('g1');

        expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 'g1' }, relations: ['subject'] });
        expect(result).toEqual(mockGrade);
      });

      it('should throw NotFoundException when grade does not exist', async () => {
        mockRepo.findOne.mockResolvedValue(null);

        await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
      });
    });

    describe('update', () => {
      it('should update an existing grade and return the updated entity', async () => {
        const dto = { value: 8.0 };
        const updatedGrade = { ...mockGrade, value: 8.0 };
        mockRepo.findOne
          .mockResolvedValueOnce(mockGrade)   // inside findOne (pre-update check)
          .mockResolvedValueOnce(updatedGrade); // inside findOne (post-update fetch)
        mockRepo.update.mockResolvedValue({ affected: 1 });

        const result = await service.update('g1', dto as any);

        expect(mockRepo.update).toHaveBeenCalledWith('g1', dto);
        expect(result).toEqual(updatedGrade);
      });

      it('should throw NotFoundException when updating non-existent grade', async () => {
        mockRepo.findOne.mockResolvedValue(null);

        await expect(service.update('bad-id', { value: 1 } as any)).rejects.toThrow(NotFoundException);
      });
    });

    describe('remove', () => {
      it('should remove the grade and return { deleted: true }', async () => {
        mockRepo.findOne.mockResolvedValue(mockGrade);
        mockRepo.remove.mockResolvedValue(mockGrade);

        const result = await service.remove('g1');

        expect(mockRepo.remove).toHaveBeenCalledWith(mockGrade);
        expect(result).toEqual({ deleted: true });
      });

      it('should throw NotFoundException when removing non-existent grade', async () => {
        mockRepo.findOne.mockResolvedValue(null);

        await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
      });
    });
  });
  ```

- [ ] **Step 2: Run the tests and verify they pass**

  ```bash
  cd apps/ms-academic && npx jest --testPathPattern="grades.service.spec" --no-coverage 2>&1 | tail -20
  ```

  Expected: `Tests: X passed`

- [ ] **Step 3: Commit**

  ```bash
  git add apps/ms-academic/src/grades/grades.service.spec.ts
  git commit -m "test(ms-academic): add unit tests for GradesService"
  ```

---

## Task 5: Add `students.service.spec.ts` for ms-academic

**Files:**
- Create: `apps/ms-academic/src/students/students.service.spec.ts`

> **Scope note:** Same as Task 4 — `TenantRepositoryService` is REQUEST-scoped but `useValue` overrides make it DEFAULT-scoped in tests. Use `module.get<StudentsService>(StudentsService)`. Fall back to `module.resolve()` if NestJS complains about request-scoped resolution.

- [ ] **Step 1: Write the test file**

  `apps/ms-academic/src/students/students.service.spec.ts`:

  ```typescript
  import { Test, TestingModule } from '@nestjs/testing';
  import { NotFoundException } from '@nestjs/common';
  import { StudentsService } from './students.service';
  import { TenantRepositoryService } from '../common/tenant/tenant-repository.service';

  describe('StudentsService', () => {
    let service: StudentsService;
    let mockRepo: any;

    const mockStudent = {
      id: 's1',
      name: 'Alice',
      email: 'alice@school.com',
      school: { id: 'sch1' },
      classes: [],
    };

    beforeEach(async () => {
      mockRepo = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
      };

      const mockTenantRepo = {
        getRepository: jest.fn().mockReturnValue(mockRepo),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StudentsService,
          { provide: TenantRepositoryService, useValue: mockTenantRepo },
        ],
      }).compile();

      service = module.get<StudentsService>(StudentsService);
    });

    describe('create', () => {
      it('should create and save a student', async () => {
        const dto = { name: 'Alice', email: 'alice@school.com', schoolId: 'sch1' };
        mockRepo.create.mockReturnValue({ ...dto, id: 's1' });
        mockRepo.save.mockResolvedValue({ ...dto, id: 's1' });

        const result = await service.create(dto as any);

        expect(mockRepo.create).toHaveBeenCalledWith(dto);
        expect(mockRepo.save).toHaveBeenCalled();
        expect(result.id).toBe('s1');
      });
    });

    describe('findAll', () => {
      it('should return all students with school and classes relations', async () => {
        mockRepo.find.mockResolvedValue([mockStudent]);

        const result = await service.findAll();

        expect(mockRepo.find).toHaveBeenCalledWith({ relations: ['school', 'classes'] });
        expect(result).toEqual([mockStudent]);
      });
    });

    describe('findOne', () => {
      it('should return the student when found', async () => {
        mockRepo.findOne.mockResolvedValue(mockStudent);

        const result = await service.findOne('s1');

        expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 's1' }, relations: ['school', 'classes'] });
        expect(result).toEqual(mockStudent);
      });

      it('should throw NotFoundException when student does not exist', async () => {
        mockRepo.findOne.mockResolvedValue(null);

        await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
      });
    });

    describe('update', () => {
      it('should merge and save the updated student', async () => {
        const dto = { name: 'Alice Updated' };
        const updatedStudent = { ...mockStudent, name: 'Alice Updated' };
        mockRepo.findOne.mockResolvedValue(mockStudent);
        mockRepo.save.mockResolvedValue(updatedStudent);

        const result = await service.update('s1', dto as any);

        expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Alice Updated' }));
        expect(result).toEqual(updatedStudent);
      });

      it('should throw NotFoundException when updating non-existent student', async () => {
        mockRepo.findOne.mockResolvedValue(null);

        await expect(service.update('bad-id', {} as any)).rejects.toThrow(NotFoundException);
      });
    });

    describe('remove', () => {
      it('should find and remove the student', async () => {
        mockRepo.findOne.mockResolvedValue(mockStudent);
        mockRepo.remove.mockResolvedValue(undefined);

        await service.remove('s1');

        expect(mockRepo.remove).toHaveBeenCalledWith(mockStudent);
      });

      it('should throw NotFoundException when removing non-existent student', async () => {
        mockRepo.findOne.mockResolvedValue(null);

        await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
      });
    });

    describe('assignToClass', () => {
      it('should return the student (stub behaviour)', async () => {
        mockRepo.findOne.mockResolvedValue(mockStudent);

        const result = await service.assignToClass('s1', 'class-1');

        expect(result).toEqual(mockStudent);
      });
    });
  });
  ```

- [ ] **Step 2: Run the tests and verify they pass**

  ```bash
  cd apps/ms-academic && npx jest --testPathPattern="students.service.spec" --no-coverage 2>&1 | tail -20
  ```

  Expected: `Tests: X passed`

- [ ] **Step 3: Commit**

  ```bash
  git add apps/ms-academic/src/students/students.service.spec.ts
  git commit -m "test(ms-academic): add unit tests for StudentsService"
  ```

---

## Task 6: Run all unit tests across the monorepo

Before creating CI, verify all tests pass locally.

- [ ] **Step 1: Run all tests from the root**

  ```bash
  cd /home/rodrigo/projetos/GestorEscolar && npm run test 2>&1 | tail -40
  ```

  Expected: All test suites pass. Note any failures.

- [ ] **Step 2: Fix any failures before proceeding**

  If any test fails, investigate and fix it. Common issues:
  - Missing mock for a new constructor dependency
  - Type mismatch in a DTO
  - Module not found (check relative imports)

---

## Task 7: Create GitHub Actions CI Workflow

**Files:**
- Create: `.github/workflows/ci.yml`

The CI runs three parallel jobs (lint, test, build) on every push to `main` and every PR targeting `main`. Each job installs dependencies with `npm ci` (uses the lockfile for reproducibility) and then delegates to Turbo via the root `npm run` scripts.

> **Note:** `actions/setup-node@v4` with `cache: 'npm'` requires a root-level `package-lock.json`. Confirm it exists before proceeding. If only workspace-level lockfiles exist, the cache step silently degrades but CI still works.

- [ ] **Step 0: Confirm `package-lock.json` exists at the monorepo root**

  ```bash
  ls package-lock.json && echo "Lockfile found" || echo "MISSING — run npm install at root first"
  ```

  Expected: `Lockfile found`. If missing, run `npm install` at the repo root to generate it, then commit it.

- [ ] **Step 1: Create the `.github/workflows/` directory**

  ```bash
  mkdir -p .github/workflows
  ```

- [ ] **Step 2: Write the workflow file**

  `.github/workflows/ci.yml`:

  ```yaml
  name: CI

  on:
    push:
      branches: [main]
    pull_request:
      branches: [main]

  jobs:
    lint:
      name: Lint
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4

        - name: Set up Node.js
          uses: actions/setup-node@v4
          with:
            node-version: 20
            cache: 'npm'

        - name: Install dependencies
          run: npm ci

        - name: Run lint
          run: npm run lint

    test:
      name: Unit Tests
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4

        - name: Set up Node.js
          uses: actions/setup-node@v4
          with:
            node-version: 20
            cache: 'npm'

        - name: Install dependencies
          run: npm ci

        - name: Run unit tests
          run: npm run test

        - name: Upload coverage reports
          if: always()
          uses: actions/upload-artifact@v4
          with:
            name: coverage-reports
            path: apps/*/coverage/
            retention-days: 7

    build:
      name: Build
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4

        - name: Set up Node.js
          uses: actions/setup-node@v4
          with:
            node-version: 20
            cache: 'npm'

        - name: Install dependencies
          run: npm ci

        - name: Build all services
          run: npm run build
  ```

- [ ] **Step 3: Verify the workflow file is valid YAML**

  ```bash
  python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))" && echo "YAML valid"
  ```

  Expected: `YAML valid`

- [ ] **Step 4: Commit**

  ```bash
  git add .github/workflows/ci.yml
  git commit -m "ci: add GitHub Actions workflow for lint, unit tests, and build"
  ```

---

## Task 8: Verify CI readiness locally

Run the same commands that CI will run, in the same order, to confirm no surprises.

- [ ] **Step 1: Simulate the test job**

  ```bash
  cd /home/rodrigo/projetos/GestorEscolar && npm run test 2>&1 | tail -30
  ```

  Expected: all suites pass.

- [ ] **Step 2: Simulate the build job**

  ```bash
  cd /home/rodrigo/projetos/GestorEscolar && npm run build 2>&1 | tail -30
  ```

  Expected: all services build without errors.

- [ ] **Step 3: Simulate the lint job**

  ```bash
  cd /home/rodrigo/projetos/GestorEscolar && npm run lint 2>&1 | tail -30
  ```

  Expected: no lint errors (warnings are OK).

- [ ] **Step 4: Final commit if any fixups were needed**

  Only commit if any file was changed in this step. Otherwise move on.

---

## Summary of Deliverables

| Deliverable | Description |
|---|---|
| `auth.service.spec.ts` fixed | Mocks `School` repo + `RefreshTokenService`; tests `refreshAccessToken`, `revokeRefreshToken`, `login` |
| `refresh-token.service.spec.ts` new | Tests Redis operations with mocked ioredis |
| `users.service.spec.ts` improved | Adds `clearAllMocks`, tests `findByEmail`, `updateProfile`, rollback path |
| `grades.service.spec.ts` new | Full CRUD coverage for GradesService |
| `students.service.spec.ts` new | Full CRUD + assignToClass coverage for StudentsService |
| `.github/workflows/ci.yml` | Parallel lint / test / build on every push and PR to main |
