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

  it('filter "Associados" shows only associated students', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Alice'));
    fireEvent.click(screen.getByText('Associados'));
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    });
  });

  it('filter "Não Associados" shows only non-associated students', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Bob'));
    fireEvent.click(screen.getByText('Não Associados'));
    await waitFor(() => {
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    });
  });
});
