# Student–School Many-to-Many Association Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ManyToOne student→school relationship with a ManyToMany student↔school relationship, add school-student management endpoints, update the school panel UI, and clean up the Alunos form.

**Architecture:** A new TypeORM migration creates the `student_schools` join table and migrates existing data; the Student and School entities are updated; three new endpoints are added to SchoolsController/Service; the frontend SchoolAlunos component is rewritten as an interactive association manager; the Alunos form loses the schoolId field.

**Tech Stack:** NestJS + TypeORM (ms-academic), React + TypeScript + Zustand + Axios (frontend), Jest (backend tests), Vitest + @testing-library/react (frontend tests)

---

## File Map

| Action | File |
|--------|------|
| Create | `apps/ms-academic/src/migrations/1748000000000-StudentSchoolManyToMany.ts` |
| Modify | `apps/ms-academic/src/students/entities/student.entity.ts` |
| Modify | `apps/ms-academic/src/students/dto/create-student.dto.ts` |
| Modify | `apps/ms-academic/src/students/students.service.ts` |
| Modify | `apps/ms-academic/src/schools/entities/school.entity.ts` |
| Modify | `apps/ms-academic/src/schools/schools.service.ts` |
| Modify | `apps/ms-academic/src/schools/schools.controller.ts` |
| Create | `apps/ms-academic/src/schools/schools.service.spec.ts` |
| Create | `apps/ms-academic/src/schools/schools.controller.spec.ts` |
| Modify | `apps/frontend/src/stores/studentStore.ts` |
| Modify | `apps/frontend/src/pages/matriz/Alunos.tsx` |
| Rewrite | `apps/frontend/src/pages/escola/gestor/SchoolAlunos.tsx` |
| Create | `apps/frontend/src/pages/escola/gestor/SchoolAlunos.spec.tsx` |

---

## Task 1: Database migration — student_schools table

**Files:**
- Create: `apps/ms-academic/src/migrations/1748000000000-StudentSchoolManyToMany.ts`

- [ ] **Step 1: Create the migration file**

```typescript
// apps/ms-academic/src/migrations/1748000000000-StudentSchoolManyToMany.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class StudentSchoolManyToMany1748000000000 implements MigrationInterface {
  name = 'StudentSchoolManyToMany1748000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create join table
    await queryRunner.query(`
      CREATE TABLE "student_schools" (
        "student_id" uuid NOT NULL,
        "school_id"  uuid NOT NULL,
        CONSTRAINT "PK_student_schools" PRIMARY KEY ("student_id", "school_id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_student_schools_student_id" ON "student_schools" ("student_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_student_schools_school_id"  ON "student_schools" ("school_id")`);
    await queryRunner.query(`
      ALTER TABLE "student_schools"
        ADD CONSTRAINT "FK_student_schools_student" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE,
        ADD CONSTRAINT "FK_student_schools_school"  FOREIGN KEY ("school_id")  REFERENCES "schools"("id")  ON DELETE CASCADE
    `);

    // Migrate existing data
    await queryRunner.query(`
      INSERT INTO "student_schools" ("student_id", "school_id")
      SELECT "id", "school_id" FROM "students" WHERE "school_id" IS NOT NULL
    `);

    // Drop old FK and column
    await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT "FK_aa8edc7905ad764f85924569647"`);
    await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "school_id"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore column and FK
    await queryRunner.query(`ALTER TABLE "students" ADD COLUMN "school_id" uuid`);
    await queryRunner.query(`
      UPDATE "students" s
      SET "school_id" = (
        SELECT "school_id" FROM "student_schools" ss WHERE ss."student_id" = s."id" LIMIT 1
      )
    `);
    await queryRunner.query(`ALTER TABLE "students" ALTER COLUMN "school_id" SET NOT NULL`);
    await queryRunner.query(`
      ALTER TABLE "students"
        ADD CONSTRAINT "FK_aa8edc7905ad764f85924569647" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE NO ACTION
    `);

    // Drop new table
    await queryRunner.query(`ALTER TABLE "student_schools" DROP CONSTRAINT "FK_student_schools_student"`);
    await queryRunner.query(`ALTER TABLE "student_schools" DROP CONSTRAINT "FK_student_schools_school"`);
    await queryRunner.query(`DROP INDEX "IDX_student_schools_student_id"`);
    await queryRunner.query(`DROP INDEX "IDX_student_schools_school_id"`);
    await queryRunner.query(`DROP TABLE "student_schools"`);
  }
}
```

- [ ] **Step 2: Verify the migration file is valid TypeScript**

```bash
cd apps/ms-academic && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to the new migration file.

- [ ] **Step 3: Commit**

```bash
git add apps/ms-academic/src/migrations/1748000000000-StudentSchoolManyToMany.ts
git commit -m "feat(ms-academic): add student_schools migration with data migration"
```

---

## Task 2: Update Student and School entities + DTO

**Files:**
- Modify: `apps/ms-academic/src/students/entities/student.entity.ts`
- Modify: `apps/ms-academic/src/students/dto/create-student.dto.ts`
- Modify: `apps/ms-academic/src/schools/entities/school.entity.ts`

- [ ] **Step 1: Update `student.entity.ts`**

Replace the `// Multi-tenancy & Relationships` section (lines 81–95). Remove `schoolId` column, `@ManyToOne School`, and update imports. The final relationships section should be:

```typescript
// Relationships
@ManyToMany(() => School, (school) => school.students)
@JoinTable({
  name: 'student_schools',
  joinColumn: { name: 'student_id', referencedColumnName: 'id' },
  inverseJoinColumn: { name: 'school_id', referencedColumnName: 'id' },
})
schools: School[];

@ManyToMany(() => Class)
@JoinTable({
  name: 'student_classes',
  joinColumn: { name: 'student_id', referencedColumnName: 'id' },
  inverseJoinColumn: { name: 'class_id', referencedColumnName: 'id' },
})
classes: Class[];
```

Also update the imports at the top — remove `ManyToOne`, `JoinColumn`; they are no longer needed (keep `ManyToMany`, `JoinTable`):

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
```

- [ ] **Step 2: Update `school.entity.ts`**

Add the inverse side of the ManyToMany. Import `ManyToMany` and `Student` (use a forward-ref import to avoid circular issues):

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  ManyToMany,
  JoinColumn,
} from 'typeorm';
import { Student } from '../students/entities/student.entity';

// Inside the School class, add after the `branches` property:
@ManyToMany(() => Student, (student) => student.schools)
students: Student[];
```

- [ ] **Step 3: Update `create-student.dto.ts`**

Remove lines 92–94 (the `schoolId` field):

```diff
-  @IsUUID()
-  @IsNotEmpty()
-  schoolId: string;
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd apps/ms-academic && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/ms-academic/src/students/entities/student.entity.ts \
        apps/ms-academic/src/students/dto/create-student.dto.ts \
        apps/ms-academic/src/schools/entities/school.entity.ts
git commit -m "feat(ms-academic): replace student schoolId with ManyToMany student_schools"
```

---

## Task 3: Update StudentsService

**Files:**
- Modify: `apps/ms-academic/src/students/students.service.ts`

- [ ] **Step 1: Update relation names in `findAll` and `findOne`**

Replace `'school'` with `'schools'` in both methods:

```typescript
async findAll(): Promise<Student[]> {
  return this.tenantRepo
    .getRepository(Student)
    .find({ relations: ['schools', 'classes'] });
}

async findOne(id: string): Promise<Student> {
  const student = await this.tenantRepo.getRepository(Student).findOne({
    where: { id },
    relations: ['schools', 'classes'],
  });
  if (!student) throw new NotFoundException(`Student with ID ${id} not found`);
  return student;
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/ms-academic && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Run existing students tests**

```bash
cd apps/ms-academic && npx jest --testPathPattern=students --verbose 2>&1 | tail -20
```

Expected: all pass (the mocks in tests don't depend on the relation name string).

- [ ] **Step 4: Commit**

```bash
git add apps/ms-academic/src/students/students.service.ts
git commit -m "fix(ms-academic): update StudentService relations from school to schools"
```

---

## Task 4: SchoolsService — getStudents, addStudent, removeStudent (TDD)

**Files:**
- Modify: `apps/ms-academic/src/schools/schools.service.ts`
- Create: `apps/ms-academic/src/schools/schools.service.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/ms-academic/src/schools/schools.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { TenantRepositoryService } from '../common/tenant/tenant-repository.service';
import { School } from './entities/school.entity';

describe('SchoolsService — student association', () => {
  let service: SchoolsService;
  let mockRepo: any;
  let mockTenantRepo: any;

  const mockSchool = {
    id: 'school-1',
    name: 'Escola A',
    cnpj: '00.000.000/0001-00',
    isMatrix: true,
    students: [],
    branches: [],
  };

  beforeEach(async () => {
    mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
        getOne: jest.fn().mockResolvedValue(null),
      }),
    };

    mockTenantRepo = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolsService,
        { provide: TenantRepositoryService, useValue: mockTenantRepo },
      ],
    }).compile();

    service = module.get<SchoolsService>(SchoolsService);
  });

  describe('getStudents', () => {
    it('should return school with students', async () => {
      const schoolWithStudents = { ...mockSchool, students: [{ id: 'stu-1' }] };
      mockRepo.findOne.mockResolvedValue(schoolWithStudents);

      const result = await service.getStudents('school-1');

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'school-1' },
        relations: ['students'],
      });
      expect(result.students).toHaveLength(1);
    });

    it('should throw NotFoundException if school not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.getStudents('nonexistent')).rejects.toThrow(
        'School not found',
      );
    });
  });

  describe('addStudent', () => {
    it('should add student to school and save', async () => {
      const schoolEmpty = { ...mockSchool, students: [] };
      const schoolWithStudent = { ...mockSchool, students: [{ id: 'stu-1' }] };
      mockRepo.findOne.mockResolvedValue(schoolEmpty);
      mockRepo.save.mockResolvedValue(schoolWithStudent);

      const result = await service.addStudent('school-1', 'stu-1');

      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ students: [{ id: 'stu-1' }] }),
      );
      expect(result.students).toContainEqual(expect.objectContaining({ id: 'stu-1' }));
    });

    it('should throw ConflictException if student already associated', async () => {
      const schoolWithStudent = { ...mockSchool, students: [{ id: 'stu-1' }] };
      mockRepo.findOne.mockResolvedValue(schoolWithStudent);

      await expect(service.addStudent('school-1', 'stu-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if school not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.addStudent('nonexistent', 'stu-1')).rejects.toThrow(
        'School not found',
      );
    });
  });

  describe('removeStudent', () => {
    it('should remove student from school, mutate entity, and save', async () => {
      const schoolWithStudent = { ...mockSchool, students: [{ id: 'stu-1' }] };
      const schoolEmpty = { ...mockSchool, students: [] };
      mockRepo.findOne.mockResolvedValue(schoolWithStudent);
      mockRepo.save.mockResolvedValue(schoolEmpty);

      const result = await service.removeStudent('school-1', 'stu-1');

      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ students: [] }),
      );
      expect(result.students).not.toContainEqual(expect.objectContaining({ id: 'stu-1' }));
    });

    it('should throw NotFoundException if student not in school', async () => {
      const schoolEmpty = { ...mockSchool, students: [] };
      mockRepo.findOne.mockResolvedValue(schoolEmpty);

      await expect(service.removeStudent('school-1', 'stu-999')).rejects.toThrow(
        'Student not associated with this school',
      );
    });

    it('should throw NotFoundException if school not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.removeStudent('nonexistent', 'stu-1')).rejects.toThrow(
        'School not found',
      );
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/ms-academic && npx jest --testPathPattern=schools.service.spec.ts --verbose 2>&1 | tail -20
```

Expected: FAIL — `service.getStudents is not a function`

- [ ] **Step 3: Implement the three methods in `SchoolsService`**

Add at the end of `apps/ms-academic/src/schools/schools.service.ts`, before the closing `}`:

```typescript
async getStudents(schoolId: string): Promise<School> {
  const school = await this.tenantRepo.getRepository(School).findOne({
    where: { id: schoolId },
    relations: ['students'],
  });
  if (!school) throw new NotFoundException('School not found');
  return school;
}

async addStudent(schoolId: string, studentId: string): Promise<School> {
  const repo = this.tenantRepo.getRepository(School);
  const school = await repo.findOne({
    where: { id: schoolId },
    relations: ['students'],
  });
  if (!school) throw new NotFoundException('School not found');
  if (school.students.some((s) => s.id === studentId)) {
    throw new ConflictException('Student already associated with this school');
  }
  school.students.push({ id: studentId } as any);
  return repo.save(school);
}

async removeStudent(schoolId: string, studentId: string): Promise<School> {
  const repo = this.tenantRepo.getRepository(School);
  const school = await repo.findOne({
    where: { id: schoolId },
    relations: ['students'],
  });
  if (!school) throw new NotFoundException('School not found');
  const index = school.students.findIndex((s) => s.id === studentId);
  if (index === -1) {
    throw new NotFoundException('Student not associated with this school');
  }
  school.students.splice(index, 1);
  return repo.save(school);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd apps/ms-academic && npx jest --testPathPattern=schools.service.spec.ts --verbose 2>&1 | tail -20
```

Expected: all 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/ms-academic/src/schools/schools.service.ts \
        apps/ms-academic/src/schools/schools.service.spec.ts
git commit -m "feat(ms-academic): add getStudents/addStudent/removeStudent to SchoolsService"
```

---

## Task 5: SchoolsController — three new routes (TDD)

**Files:**
- Create: `apps/ms-academic/src/schools/schools.controller.spec.ts`
- Modify: `apps/ms-academic/src/schools/schools.controller.ts`

- [ ] **Step 1: Write the failing controller test**

Create `apps/ms-academic/src/schools/schools.controller.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolsController } from './schools.controller';
import { SchoolsService } from './schools.service';

describe('SchoolsController — student association', () => {
  let controller: SchoolsController;
  let service: jest.Mocked<SchoolsService>;

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      getSchoolMetrics: jest.fn(),
      getStudents: jest.fn(),
      addStudent: jest.fn(),
      removeStudent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchoolsController],
      providers: [{ provide: SchoolsService, useValue: mockService }],
    }).compile();

    controller = module.get<SchoolsController>(SchoolsController);
    service = module.get(SchoolsService);
  });

  describe('getStudents', () => {
    it('should call service.getStudents with schoolId', async () => {
      const schoolId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      service.getStudents.mockResolvedValue({ id: schoolId, students: [] } as any);

      await controller.getStudents(schoolId);

      expect(service.getStudents).toHaveBeenCalledWith(schoolId);
    });
  });

  describe('addStudent', () => {
    it('should call service.addStudent with schoolId and studentId', async () => {
      const schoolId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const studentId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
      service.addStudent.mockResolvedValue({ id: schoolId, students: [] } as any);

      await controller.addStudent(schoolId, studentId);

      expect(service.addStudent).toHaveBeenCalledWith(schoolId, studentId);
    });
  });

  describe('removeStudent', () => {
    it('should call service.removeStudent with schoolId and studentId', async () => {
      const schoolId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const studentId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
      service.removeStudent.mockResolvedValue({ id: schoolId, students: [] } as any);

      await controller.removeStudent(schoolId, studentId);

      expect(service.removeStudent).toHaveBeenCalledWith(schoolId, studentId);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/ms-academic && npx jest --testPathPattern=schools.controller.spec.ts --verbose 2>&1 | tail -15
```

Expected: FAIL — methods not found on controller

- [ ] **Step 3: Add routes to `SchoolsController`**

Add before the closing `}` of `apps/ms-academic/src/schools/schools.controller.ts`:

```typescript
@Get(':id/students')
getStudents(@Param('id', ParseUUIDPipe) id: string) {
  return this.schoolsService.getStudents(id);
}

@Post(':id/students')
addStudent(
  @Param('id', ParseUUIDPipe) id: string,
  @Body('studentId', ParseUUIDPipe) studentId: string,
) {
  return this.schoolsService.addStudent(id, studentId);
}

@Delete(':id/students/:studentId')
removeStudent(
  @Param('id', ParseUUIDPipe) id: string,
  @Param('studentId', ParseUUIDPipe) studentId: string,
) {
  return this.schoolsService.removeStudent(id, studentId);
}
```

All decorators (`Get`, `Post`, `Delete`, `Body`, `Param`, `ParseUUIDPipe`) are already imported.

- [ ] **Step 4: Run all schools tests**

```bash
cd apps/ms-academic && npx jest --testPathPattern=schools --verbose 2>&1 | tail -25
```

Expected: all tests PASS

- [ ] **Step 5: Run the full backend test suite**

```bash
cd apps/ms-academic && npx jest --verbose 2>&1 | tail -15
```

Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add apps/ms-academic/src/schools/schools.controller.ts \
        apps/ms-academic/src/schools/schools.controller.spec.ts
git commit -m "feat(ms-academic): add GET/POST/DELETE /schools/:id/students endpoints"
```

---

## Task 6: Frontend — update studentStore and Alunos.tsx

**Files:**
- Modify: `apps/frontend/src/stores/studentStore.ts`
- Modify: `apps/frontend/src/pages/matriz/Alunos.tsx`

- [ ] **Step 1: Update `studentStore.ts`**

In `IStudent` interface: remove `schoolId: string` (line 25), add `schools?: { id: string }[]`:

```typescript
export interface IStudent {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  birthDate: string;
  enrollmentNumber: string;
  enrollmentDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  guardianName?: string;
  guardianCpf?: string;
  guardianEmail?: string;
  guardianPhone?: string;
  schools?: { id: string }[];
  classes?: { id: string }[];
}
```

The `addStudent` signature uses `Omit<IStudent, 'id' | 'enrollmentDate' | 'classes'>` — since `schoolId` is removed from `IStudent`, it is automatically gone from the Omit type too. No further change needed in the store.

- [ ] **Step 2: Update `Alunos.tsx` — remove schoolId-related code**

Make the following removals in `apps/frontend/src/pages/matriz/Alunos.tsx`:

**a) Remove `useSchoolStore` import** (line 7):
```diff
-import { useSchoolStore } from '../../stores/schoolStore';
```

**b) Remove `schools` and `fetchSchools` destructure** (line 38):
```diff
-const { schools, fetchSchools } = useSchoolStore();
```

**c) Remove `schoolId: ''` from `formData` initial state** (line 68):
```diff
-    schoolId: '',
```

**d) Remove `fetchSchools()` call from the `useEffect`** (line 77):
```diff
 useEffect(() => {
   fetchStudents();
-  fetchSchools();
-}, [fetchStudents, fetchSchools]);
+}, [fetchStudents]);
```

**e) Remove the `matrixSchool` memo** (line 79):
```diff
-const matrixSchool = useMemo(() => schools.find(s => s.isMatrix), [schools]);
```

**f) Remove the `matrixSchool` useEffect** (lines 81–85):
```diff
-useEffect(() => {
-  if (matrixSchool && !formData.schoolId) {
-    setFormData(prev => ({ ...prev, schoolId: matrixSchool.id }));
-  }
-}, [matrixSchool, formData.schoolId]);
```

**g) Remove `schoolId: matrixSchool?.id || ''` from the new-student branch in `handleOpenFormModal`** (line ~154):
```diff
       schoolId: matrixSchool?.id || '',  // remove this line
```

**h) Remove the "Unidade Principal" read-only field block** (lines ~539–542):
```diff
-<div>
-  <label className="text-xs font-bold text-text-muted uppercase mb-2 block tracking-wider">Unidade Principal</label>
-  <input disabled value={matrixSchool?.name || 'Não definida'} className="w-full bg-secondary/50 border border-border rounded-xl p-3 text-text-muted cursor-not-allowed" />
-</div>
```

**i) Remove `schoolId: student.schoolId` from the edit-student branch in `handleOpenFormModal`**:

When opening the form modal for an existing student (the `else` branch of the student-exists check in `handleOpenFormModal`), there is a `setFormData` call that includes `schoolId: student.schoolId`. Remove that line:
```diff
-    schoolId: student.schoolId,
```

**j) Update the `formData` type** (line 49) to reflect that `schoolId` is gone:
```typescript
const [formData, setFormData] = useState<Omit<IStudent, 'id' | 'enrollmentDate' | 'classes' | 'schools'>>({
  name: '',
  email: '',
  cpf: '',
  phone: '',
  birthDate: '',
  enrollmentNumber: '',
  status: 'ACTIVE',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  zipCode: '',
  guardianName: '',
  guardianCpf: '',
  guardianEmail: '',
  guardianPhone: '',
});
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd apps/frontend && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Run frontend tests**

```bash
cd apps/frontend && npx vitest run 2>&1 | tail -15
```

Expected: all tests PASS (SchoolAlunos previously filtered by `schoolId` so its test file doesn't exist yet — no regression expected).

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/stores/studentStore.ts \
        apps/frontend/src/pages/matriz/Alunos.tsx
git commit -m "feat(frontend): remove schoolId from student form and store"
```

---

## Task 7: Frontend — rewrite SchoolAlunos with association UI (TDD)

**Files:**
- Create: `apps/frontend/src/pages/escola/gestor/SchoolAlunos.spec.tsx`
- Rewrite: `apps/frontend/src/pages/escola/gestor/SchoolAlunos.tsx`

- [ ] **Step 1: Write the failing Vitest tests**

Create `apps/frontend/src/pages/escola/gestor/SchoolAlunos.spec.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SchoolAlunos from './SchoolAlunos';
import api from '../../../lib/api';

vi.mock('../../../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../../stores/studentStore', () => ({
  useStudentStore: vi.fn(() => ({
    students: [
      { id: 'stu-1', name: 'Alice', enrollmentNumber: 'E001', status: 'ACTIVE' },
      { id: 'stu-2', name: 'Bob',   enrollmentNumber: 'E002', status: 'ACTIVE' },
    ],
    fetchStudents: vi.fn(),
  })),
}));

// Renders SchoolAlunos with /escola/school-1/alunos route
function renderComponent() {
  return render(
    <MemoryRouter initialEntries={['/escola/school-1/alunos']}>
      <Routes>
        <Route path="/escola/:id/alunos" element={<SchoolAlunos />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  // school-1 has Alice (stu-1) already associated
  vi.mocked(api.get).mockResolvedValue({ data: { id: 'school-1', students: [{ id: 'stu-1' }] } });
  vi.mocked(api.post).mockResolvedValue({ data: {} });
  vi.mocked(api.delete).mockResolvedValue({ data: {} });
});

describe('SchoolAlunos', () => {
  it('shows "Remover" for associated student and "Associar" for non-associated', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Alice'));
    expect(screen.getByText('Remover')).toBeInTheDocument();
    expect(screen.getByText('Associar')).toBeInTheDocument();
  });

  it('calls POST when "Associar" is clicked', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Associar'));
    fireEvent.click(screen.getByText('Associar'));
    await waitFor(() => {
      expect(vi.mocked(api.post)).toHaveBeenCalledWith(
        '/academic/schools/school-1/students',
        { studentId: 'stu-2' },
      );
    });
  });

  it('calls DELETE when "Remover" is clicked', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Remover'));
    fireEvent.click(screen.getByText('Remover'));
    await waitFor(() => {
      expect(vi.mocked(api.delete)).toHaveBeenCalledWith(
        '/academic/schools/school-1/students/stu-1',
      );
    });
  });

  it('updates button state after successful association', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Associar'));

    // After POST, re-fetch returns both students associated
    vi.mocked(api.get).mockResolvedValue({
      data: { id: 'school-1', students: [{ id: 'stu-1' }, { id: 'stu-2' }] },
    });

    fireEvent.click(screen.getByText('Associar'));
    await waitFor(() => {
      expect(screen.getAllByText('Remover')).toHaveLength(2);
    });
  });

  it('filters students by search term', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Alice'));
    fireEvent.change(screen.getByPlaceholderText('Buscar aluno...'), {
      target: { value: 'Bob' },
    });
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows the count of associated students', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('1'));  // one associated student
    // counter is in the header card
    expect(screen.getByText('Alunos Matriculados')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/frontend && npx vitest run src/pages/escola/gestor/SchoolAlunos.spec.tsx 2>&1 | tail -25
```

Expected: FAIL — "Remover"/"Associar" buttons not found

- [ ] **Step 3: Rewrite `SchoolAlunos.tsx`**

Replace the entire contents of `apps/frontend/src/pages/escola/gestor/SchoolAlunos.tsx` with:

```tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { Users, Search, Loader2 } from 'lucide-react';
import { useStudentStore } from '../../../stores/studentStore';
import api from '../../../lib/api';

interface AssociatedStudent {
  id: string;
}

const SchoolAlunos: React.FC = () => {
  const { id: schoolId } = useParams<{ id: string }>();
  const { students, fetchStudents } = useStudentStore();

  const [schoolStudents, setSchoolStudents] = useState<AssociatedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');

  const fetchSchoolStudents = async () => {
    if (!schoolId) return;
    try {
      const res = await api.get(`/academic/schools/${schoolId}/students`);
      setSchoolStudents(res.data.students ?? []);
    } catch {
      setError('Erro ao carregar alunos da escola.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchSchoolStudents();
  }, [schoolId]);

  const handleAssociate = async (studentId: string) => {
    try {
      await api.post(`/academic/schools/${schoolId}/students`, { studentId });
      await fetchSchoolStudents();
    } catch {
      setError('Erro ao associar aluno.');
    }
  };

  const handleRemove = async (studentId: string) => {
    try {
      await api.delete(`/academic/schools/${schoolId}/students/${studentId}`);
      await fetchSchoolStudents();
    } catch {
      setError('Erro ao remover aluno.');
    }
  };

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return students;
    const term = studentSearch.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.enrollmentNumber.toLowerCase().includes(term),
    );
  }, [students, studentSearch]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">Gerenciar Alunos</h3>
          <p className="text-text-muted">Associe ou remova alunos desta unidade</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="text-primary animate-spin" size={32} />
        </div>
      ) : (
        <Card className="bg-surface border-border overflow-hidden p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{schoolStudents.length}</p>
              <h4 className="text-sm font-black uppercase text-text-muted tracking-widest">
                Alunos Matriculados
              </h4>
            </div>
          </div>

          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              size={16}
            />
            <input
              type="text"
              placeholder="Buscar aluno..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-primary outline-none transition-all"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-white/5">
                  <th className="px-6 py-4 text-xs font-black uppercase text-text-muted tracking-widest">
                    Nome do Aluno
                  </th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-text-muted tracking-widest">
                    Matrícula
                  </th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-text-muted tracking-widest">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-text-muted tracking-widest text-right">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => {
                    const isAssociated = schoolStudents.some((s) => s.id === student.id);
                    return (
                      <tr key={student.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-white uppercase">
                          {student.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-text-muted font-mono">
                          {student.enrollmentNumber}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              student.status === 'ACTIVE'
                                ? 'bg-success/20 text-success'
                                : student.status === 'INACTIVE'
                                  ? 'bg-error/20 text-error'
                                  : 'bg-warning/20 text-warning'
                            }`}
                          >
                            {student.status === 'ACTIVE'
                              ? 'Ativo'
                              : student.status === 'INACTIVE'
                                ? 'Inativo'
                                : 'Suspenso'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isAssociated ? (
                            <Button
                              variant="danger"
                              className="text-xs h-8 px-4"
                              onClick={() => handleRemove(student.id)}
                            >
                              Remover
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              className="text-xs h-8 px-4"
                              onClick={() => handleAssociate(student.id)}
                            >
                              Associar
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-text-muted italic"
                    >
                      Nenhum aluno encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SchoolAlunos;
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd apps/frontend && npx vitest run src/pages/escola/gestor/SchoolAlunos.spec.tsx 2>&1 | tail -25
```

Expected: all 6 tests PASS

- [ ] **Step 5: Run full frontend test suite**

```bash
cd apps/frontend && npx vitest run 2>&1 | tail -15
```

Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/pages/escola/gestor/SchoolAlunos.tsx \
        apps/frontend/src/pages/escola/gestor/SchoolAlunos.spec.tsx
git commit -m "feat(frontend): rewrite SchoolAlunos with interactive student association UI"
```

---

## Task 8: Final verification

- [ ] **Step 1: Run all backend tests**

```bash
cd apps/ms-academic && npx jest --verbose 2>&1 | tail -15
```

Expected: all tests PASS

- [ ] **Step 2: Run all frontend tests**

```bash
cd apps/frontend && npx vitest run 2>&1 | tail -10
```

Expected: all tests PASS

- [ ] **Step 3: TypeScript check on both projects**

```bash
cd apps/ms-academic && npx tsc --noEmit 2>&1 | head -10
cd apps/frontend && npx tsc --noEmit 2>&1 | head -10
```

Expected: no errors on either.
