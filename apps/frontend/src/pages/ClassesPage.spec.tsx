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
    await waitFor(() => screen.getByText('Alice'));
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
    await waitFor(() => screen.getByText('Alice'));
    fireEvent.change(screen.getByPlaceholderText('Buscar aluno...'), {
      target: { value: 'Bob' },
    });
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });
});
