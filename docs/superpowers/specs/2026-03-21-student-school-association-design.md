# Student–School Association Design

## Goal

Replace the current single-school (ManyToOne `schoolId`) student model with a many-to-many student–school relationship. Students are registered centrally in the Alunos screen (no school at creation time), then associated to one or more schools via each school's admin panel. Classes continue to draw from all network students.

---

## Data Model

### Migration (new file alongside `InitialSchema`)

1. Create table `student_schools`:
   - `student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE`
   - `school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE`
   - PRIMARY KEY `(student_id, school_id)`
   - Indexes on both columns

2. Migrate existing data:
   ```sql
   INSERT INTO student_schools (student_id, school_id)
   SELECT id, school_id FROM students WHERE school_id IS NOT NULL;
   ```

3. Drop column `school_id` from `students`.

### Entities

**`Student` entity** (`apps/ms-academic/src/students/entities/student.entity.ts`):
- Remove `@Column({ name: 'school_id' }) schoolId: string`
- Remove `@ManyToOne(() => School) @JoinColumn school: School`
- Add:
  ```typescript
  @ManyToMany(() => School, (school) => school.students)
  @JoinTable({
    name: 'student_schools',
    joinColumn: { name: 'student_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'school_id', referencedColumnName: 'id' },
  })
  schools: School[];
  ```

**`School` entity** (`apps/ms-academic/src/schools/entities/school.entity.ts`):
- Add:
  ```typescript
  @ManyToMany(() => Student, (student) => student.schools)
  students: Student[];
  ```
  (No `@JoinTable` — owned by Student side)

### DTO

**`CreateStudentDto`** (`apps/ms-academic/src/students/dto/create-student.dto.ts`):
- Remove `@IsUUID() @IsNotEmpty() schoolId: string` entirely

**`UpdateStudentDto`** — inherits from `PartialType(CreateStudentDto)`, no extra change needed.

---

## API Endpoints

### New — `SchoolsController`

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/academic/schools/:id/students` | List students associated with school |
| `POST` | `/academic/schools/:id/students` | Associate student to school — body: `{ studentId: string }` |
| `DELETE` | `/academic/schools/:id/students/:studentId` | Disassociate student from school |

All three inherit the class-level `@Roles(ADMIN, MANAGER, GESTOR)` already on `SchoolsController`.

### New — `SchoolsService` methods

```typescript
getStudents(schoolId: string): Promise<School>
// findOne with relations: ['students'], returns school with students array

addStudent(schoolId: string, studentId: string): Promise<School>
// findOne with relations: ['students']
// throws ConflictException if student already associated
// pushes { id: studentId } to school.students, saves

removeStudent(schoolId: string, studentId: string): Promise<School>
// findOne with relations: ['students']
// throws NotFoundException if student not in school
// splices student from array, saves
```

Pattern mirrors `ClassesService.assignStudent` / `ClassesService.removeStudent` exactly.

### Changed — `StudentsService`

- `findAll()`: remove relations `['school']` (no longer exists); add `['schools']` if needed
- `findOne(id)`: same — replace `'school'` relation with `'schools'`
- `create()`: no longer sets `schoolId`

---

## Frontend

### `Alunos.tsx` (`apps/frontend/src/pages/matriz/Alunos.tsx`)

- Remove `schoolId` from `formData` initial state and from the `IStudent` omit type
- Remove the "Unidade Principal" read-only field block (lines ~539–542)
- Remove the `matrixSchool` useEffect that auto-sets `schoolId` (lines ~81–85)
- `IStudent` in `studentStore.ts`: remove `schoolId: string`, add `schools?: { id: string }[]`

### `SchoolAlunos.tsx` (`apps/frontend/src/pages/escola/gestor/SchoolAlunos.tsx`)

Full rewrite — replaces the read-only filtered list with an interactive association manager:

**State:**
- `schoolStudents: { id: string }[]` — fetched from `GET /academic/schools/:id/students`
- `allStudents` — from `useStudentStore()` (all network students)
- `studentSearch: string` — modal filter
- `loading`, `error`

**Behavior:**
- On mount: `fetchStudents()` (all students) + `GET /academic/schools/:id/students` (associated IDs)
- For each student in the list:
  - If `schoolStudents.some(s => s.id === student.id)` → show **"Remover"** button (danger) → calls `DELETE /academic/schools/:id/students/:studentId`
  - Otherwise → show **"Associar"** button (outline) → calls `POST /academic/schools/:id/students`
- After each action: re-fetch `GET /academic/schools/:id/students` to update state
- Search input filters `allStudents` by name or `enrollmentNumber`
- Counter: "X alunos nesta escola"

**Note:** Local state for `schoolStudents` (not in Zustand) — this data is school-specific and fetched fresh per page visit.

### `ClassesPage.tsx`

No changes — continues to show all network students when assigning to classes.

---

## Testing

### Backend

- `SchoolsService` unit tests (Jest) — same pattern as `ClassesService`:
  - `getStudents`: returns school with students relation
  - `addStudent`: happy path (adds + saves), ConflictException if already associated
  - `removeStudent`: happy path (removes + saves, asserts entity mutated before save), NotFoundException if not associated, NotFoundException if school not found

- `SchoolsController` unit test:
  - `getStudents`, `addStudent`, `removeStudent` delegate to service with correct params

### Frontend

- `SchoolAlunos.spec.tsx` (Vitest + @testing-library/react):
  - Shows "Associar" for non-associated students
  - Shows "Remover" for associated students
  - Calls POST when "Associar" is clicked
  - Calls DELETE when "Remover" is clicked
  - Filters by search term
  - Updates button state after successful action

- `Alunos.spec.tsx` (if created): form no longer has schoolId field

---

## File Map

| Action | File |
|--------|------|
| Modify | `apps/ms-academic/src/students/entities/student.entity.ts` |
| Modify | `apps/ms-academic/src/students/dto/create-student.dto.ts` |
| Modify | `apps/ms-academic/src/students/students.service.ts` |
| Modify | `apps/ms-academic/src/schools/entities/school.entity.ts` |
| Modify | `apps/ms-academic/src/schools/schools.service.ts` |
| Modify | `apps/ms-academic/src/schools/schools.controller.ts` |
| Create | `apps/ms-academic/src/schools/schools.service.spec.ts` (new methods) |
| Create | `apps/ms-academic/src/schools/schools.controller.spec.ts` |
| Create | `apps/ms-academic/src/migrations/<timestamp>-StudentSchoolManyToMany.ts` |
| Modify | `apps/frontend/src/stores/studentStore.ts` |
| Modify | `apps/frontend/src/pages/matriz/Alunos.tsx` |
| Rewrite | `apps/frontend/src/pages/escola/gestor/SchoolAlunos.tsx` |
| Create | `apps/frontend/src/pages/escola/gestor/SchoolAlunos.spec.tsx` |
