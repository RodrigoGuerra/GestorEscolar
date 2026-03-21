# Class-Student Association Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to associate and disassociate registered students from a class on the class management screen.

**Architecture:** Add a `removeStudent` method to `ClassesService` and a `DELETE /academic/classes/:id/students/:studentId` endpoint in the backend; update the `ClassesPage` frontend modal to display enrolled students with a "Desmatricular" button alongside existing enrollment, using student search to filter the list.

**Tech Stack:** NestJS (ms-academic), React + TypeScript + Zustand + Axios (frontend), Jest (backend tests), Vitest (frontend tests)

---

## File Map

### Backend (ms-academic)
- **Modify:** `apps/ms-academic/src/classes/classes.service.ts` — add `removeStudent` method
- **Modify:** `apps/ms-academic/src/classes/classes.controller.ts` — add `DELETE :id/students/:studentId` route
- **Modify:** `apps/ms-academic/src/classes/classes.service.spec.ts` — add `removeStudent` tests
- **Create:** `apps/ms-academic/src/classes/classes.controller.spec.ts` — add controller route tests (TDD)

### Frontend
- **Modify:** `apps/frontend/src/pages/ClassesPage.tsx` — update modal: add search, `studentSearch` state at top, `handleRemoveStudent` handler, "Desmatricular" button
- **Create:** `apps/frontend/src/pages/ClassesPage.spec.tsx` — Vitest tests for new behavior

---

## Task 1: Backend — `removeStudent` service method

**Files:**
- Modify: `apps/ms-academic/src/classes/classes.service.ts`
- Modify: `apps/ms-academic/src/classes/classes.service.spec.ts`

- [ ] **Step 1: Write the failing tests for `removeStudent`**

Add inside `describe('ClassesService')` in `apps/ms-academic/src/classes/classes.service.spec.ts`:

```typescript
describe('removeStudent', () => {
  it('should remove student from class, mutate entity, and save', async () => {
    const studentId = 'stu-1';
    const classWithStudent = { ...mockClass, students: [{ id: studentId }] };
    const classWithoutStudent = { ...mockClass, students: [] };

    mockRepo.findOne.mockResolvedValue(classWithStudent);
    mockRepo.save.mockResolvedValue(classWithoutStudent);

    const result = await service.removeStudent('cls-1', studentId);

    // Verify the entity was mutated before save
    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ students: [] }),
    );
    expect(result.students).not.toContainEqual(expect.objectContaining({ id: studentId }));
  });

  it('should throw NotFoundException if student is not assigned to class', async () => {
    const classWithNoStudents = { ...mockClass, students: [] };
    mockRepo.findOne.mockResolvedValue(classWithNoStudents);

    await expect(service.removeStudent('cls-1', 'stu-999')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw NotFoundException if class does not exist', async () => {
    mockRepo.findOne.mockResolvedValue(null);

    await expect(service.removeStudent('nonexistent', 'stu-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/ms-academic && npx jest --testPathPattern=classes.service.spec.ts --verbose 2>&1 | tail -20
```

Expected: FAIL — `service.removeStudent is not a function`

- [ ] **Step 3: Implement `removeStudent` in `ClassesService`**

Add to `apps/ms-academic/src/classes/classes.service.ts` after the `assignStudent` method:

```typescript
async removeStudent(classId: string, studentId: string) {
  const repo = this.tenantRepo.getRepository(Class);
  const classEntity = await repo.findOne({
    where: { id: classId },
    relations: ['students'],
  });
  if (!classEntity) throw new NotFoundException('Class not found');
  const index = classEntity.students.findIndex((s) => s.id === studentId);
  if (index === -1) {
    throw new NotFoundException('Student not assigned to this class');
  }
  classEntity.students.splice(index, 1);
  return repo.save(classEntity);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd apps/ms-academic && npx jest --testPathPattern=classes.service.spec.ts --verbose 2>&1 | tail -20
```

Expected: All `ClassesService` tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/ms-academic/src/classes/classes.service.ts apps/ms-academic/src/classes/classes.service.spec.ts
git commit -m "feat(ms-academic): add removeStudent method to ClassesService"
```

---

## Task 2: Backend — `DELETE` endpoint in controller (TDD)

**Files:**
- Create: `apps/ms-academic/src/classes/classes.controller.spec.ts`
- Modify: `apps/ms-academic/src/classes/classes.controller.ts`

- [ ] **Step 1: Write the failing controller test**

Create `apps/ms-academic/src/classes/classes.controller.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';

describe('ClassesController', () => {
  let controller: ClassesController;
  let service: jest.Mocked<ClassesService>;

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      assignStudent: jest.fn(),
      removeStudent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClassesController],
      providers: [{ provide: ClassesService, useValue: mockService }],
    }).compile();

    controller = module.get<ClassesController>(ClassesController);
    service = module.get(ClassesService);
  });

  describe('removeStudent', () => {
    it('should call service.removeStudent with classId and studentId', async () => {
      const classId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const studentId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
      service.removeStudent.mockResolvedValue({ id: classId, students: [] } as any);

      await controller.removeStudent(classId, studentId);

      expect(service.removeStudent).toHaveBeenCalledWith(classId, studentId);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/ms-academic && npx jest --testPathPattern=classes.controller.spec.ts --verbose 2>&1 | tail -20
```

Expected: FAIL — `controller.removeStudent is not a function`

- [ ] **Step 3: Add the DELETE route to the controller**

In `apps/ms-academic/src/classes/classes.controller.ts`, add before the final closing `}` of the class (before line 56):

```typescript
@Delete(':id/students/:studentId')
removeStudent(
  @Param('id', ParseUUIDPipe) id: string,
  @Param('studentId', ParseUUIDPipe) studentId: string,
) {
  return this.classesService.removeStudent(id, studentId);
}
```

The `Delete` and `Param` decorators are already imported in lines 7-8.

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd apps/ms-academic && npx jest --testPathPattern=classes --verbose 2>&1 | tail -30
```

Expected: All class tests (service + controller) PASS

- [ ] **Step 5: Commit**

```bash
git add apps/ms-academic/src/classes/classes.controller.ts apps/ms-academic/src/classes/classes.controller.spec.ts
git commit -m "feat(ms-academic): add DELETE /classes/:id/students/:studentId endpoint"
```

---

## Task 3: Frontend — update assign modal with search and disassociation

**Files:**
- Create: `apps/frontend/src/pages/ClassesPage.spec.tsx`
- Modify: `apps/frontend/src/pages/ClassesPage.tsx`

The Zustand stores in this project use a selector pattern: `useAuthStore(state => state.token)`. Mocking them requires an `mockImplementation` that accepts and calls the selector function.

- [ ] **Step 1: Write the failing Vitest tests**

Create `apps/frontend/src/pages/ClassesPage.spec.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClassesPage from './ClassesPage';
import api from '../lib/api';

vi.mock('../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn((selector) =>
    selector({
      token: 'mock-token',
      user: null,
      role: 'GESTOR',
      unidadeAtual: null,
    }),
  ),
}));

vi.mock('../stores/tenantStore', () => ({
  useTenantStore: vi.fn((selector) =>
    selector({ currentTenant: { id: 'school-1', name: 'Escola A', schema: 'school_1' } }),
  ),
}));

vi.mock('../stores/studentStore', () => ({
  useStudentStore: vi.fn(() => ({
    students: [
      { id: 'stu-1', name: 'Alice', enrollmentNumber: 'E001' },
      { id: 'stu-2', name: 'Bob', enrollmentNumber: 'E002' },
    ],
    fetchStudents: vi.fn(),
  })),
}));

const mockClassWithAlice = {
  id: 'cls-1',
  name: 'Turma A',
  year: 2026,
  students: [{ id: 'stu-1' }],
};

const mockClassEmpty = {
  ...mockClassWithAlice,
  students: [],
};

beforeEach(() => {
  vi.mocked(api.get).mockResolvedValue({ data: [mockClassWithAlice] });
  vi.mocked(api.post).mockResolvedValue({ data: {} });
  vi.mocked(api.delete).mockResolvedValue({ data: {} });
});

describe('ClassesPage - student management modal', () => {
  it('shows "Gerenciar Alunos" button on class card', async () => {
    render(<ClassesPage />);
    await waitFor(() => screen.getByText('Turma A'));
    expect(screen.getByText('Gerenciar Alunos')).toBeInTheDocument();
  });

  it('shows "Desmatricular" for enrolled student and "Matricular" for non-enrolled', async () => {
    render(<ClassesPage />);
    await waitFor(() => screen.getByText('Turma A'));
    fireEvent.click(screen.getByText('Gerenciar Alunos'));
    await waitFor(() => screen.getByText('ALICE'));
    expect(screen.getByText('Desmatricular')).toBeInTheDocument();
    expect(screen.getByText('Matricular')).toBeInTheDocument();
  });

  it('calls DELETE endpoint when "Desmatricular" is clicked', async () => {
    render(<ClassesPage />);
    await waitFor(() => screen.getByText('Turma A'));
    fireEvent.click(screen.getByText('Gerenciar Alunos'));
    await waitFor(() => screen.getByText('Desmatricular'));
    fireEvent.click(screen.getByText('Desmatricular'));
    await waitFor(() => {
      expect(vi.mocked(api.delete)).toHaveBeenCalledWith(
        '/academic/classes/cls-1/students/stu-1',
      );
    });
  });

  it('shows updated button after successful removal', async () => {
    render(<ClassesPage />);
    await waitFor(() => screen.getByText('Turma A'));
    fireEvent.click(screen.getByText('Gerenciar Alunos'));
    await waitFor(() => screen.getByText('Desmatricular'));

    // After removal, api.get returns the class without the student
    vi.mocked(api.get).mockResolvedValue({ data: [mockClassEmpty] });

    fireEvent.click(screen.getByText('Desmatricular'));
    await waitFor(() => {
      // Both buttons should now show "Matricular" (Alice and Bob both unenrolled)
      const enrollButtons = screen.getAllByText('Matricular');
      expect(enrollButtons).toHaveLength(2);
    });
  });

  it('filters students by search term inside the modal', async () => {
    render(<ClassesPage />);
    await waitFor(() => screen.getByText('Turma A'));
    fireEvent.click(screen.getByText('Gerenciar Alunos'));
    await waitFor(() => screen.getByText('ALICE'));
    fireEvent.change(screen.getByPlaceholderText('Buscar aluno...'), {
      target: { value: 'Bob' },
    });
    expect(screen.queryByText('ALICE')).not.toBeInTheDocument();
    expect(screen.getByText('BOB')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/frontend && npx vitest run src/pages/ClassesPage.spec.tsx 2>&1 | tail -30
```

Expected: FAIL — "Gerenciar Alunos" not found / "Desmatricular" not found

- [ ] **Step 3: Apply changes to `ClassesPage.tsx`**

**3a — Add `studentSearch` state at the top of the component** (alongside the other `useState` declarations, after line 26 where `formData` is declared):

```typescript
const [studentSearch, setStudentSearch] = useState('');
```

**3b — Add `handleRemoveStudent` and `filteredModalStudents`** after `handleAssignStudent` (after line 77):

```typescript
const handleRemoveStudent = async (studentId: string) => {
  if (!selectedClass) return;
  try {
    await api.delete(`/academic/classes/${selectedClass.id}/students/${studentId}`);
    fetchClasses();
  } catch (err) {
    console.error('Error removing student', err);
  }
};

const filteredModalStudents = useMemo(() => {
  if (!studentSearch) return students;
  return students.filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.enrollmentNumber.toLowerCase().includes(studentSearch.toLowerCase())
  );
}, [students, studentSearch]);
```

**3c — Rename the class card button** (line 141) from `Matricular Alunos` to `Gerenciar Alunos`.

**3d — Replace the entire `{/* Assign Student Modal */}` block** (lines 179–208) with:

```tsx
{/* Manage Students Modal */}
<Modal
  isOpen={isAssignModalOpen}
  onClose={() => { setIsAssignModalOpen(false); setStudentSearch(''); }}
  title={`Gerenciar Alunos - ${selectedClass?.name}`}
  maxWidth="max-w-xl"
>
  <div className="space-y-4">
    <p className="text-text-secondary text-sm">
      Matricule ou desmatricule alunos cadastrados nesta turma.
    </p>

    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
      <input
        type="text"
        placeholder="Buscar aluno..."
        value={studentSearch}
        onChange={(e) => setStudentSearch(e.target.value)}
        className="w-full bg-secondary border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-primary outline-none transition-all"
      />
    </div>

    <div className="max-h-96 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
      {filteredModalStudents.length === 0 ? (
        <p className="text-text-muted text-sm italic text-center py-6">Nenhum aluno encontrado.</p>
      ) : filteredModalStudents.map(student => {
        const isAssigned = selectedClass?.students?.some(s => s.id === student.id);
        return (
          <div key={student.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl">
            <div>
              <p className="text-sm font-bold text-white uppercase">{student.name}</p>
              <p className="text-[10px] text-text-muted uppercase font-black">{student.enrollmentNumber}</p>
            </div>
            {isAssigned ? (
              <Button
                variant="danger"
                className="text-[10px] h-8 px-4"
                onClick={() => handleRemoveStudent(student.id)}
              >
                Desmatricular
              </Button>
            ) : (
              <Button
                variant="outline"
                className="text-[10px] h-8 px-4"
                onClick={() => handleAssignStudent(student.id)}
              >
                Matricular
              </Button>
            )}
          </div>
        );
      })}
    </div>

    <Button
      variant="secondary"
      className="w-full"
      onClick={() => { setIsAssignModalOpen(false); setStudentSearch(''); }}
    >
      Fechar
    </Button>
  </div>
</Modal>
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd apps/frontend && npx vitest run src/pages/ClassesPage.spec.tsx 2>&1 | tail -30
```

Expected: All 5 tests PASS

- [ ] **Step 5: Run full frontend test suite to check for regressions**

```bash
cd apps/frontend && npx vitest run 2>&1 | tail -20
```

Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/pages/ClassesPage.tsx apps/frontend/src/pages/ClassesPage.spec.tsx
git commit -m "feat(frontend): add student disassociation and search to class management modal"
```

---

## Task 4: Final verification

- [ ] **Step 1: Run all backend tests**

```bash
cd apps/ms-academic && npx jest --verbose 2>&1 | tail -30
```

Expected: All tests PASS

- [ ] **Step 2: Run all frontend tests**

```bash
cd apps/frontend && npx vitest run 2>&1 | tail -20
```

Expected: All tests PASS
