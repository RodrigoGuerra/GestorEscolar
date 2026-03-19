import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSchoolStore } from './schoolStore';
import api from '../lib/api';

vi.mock('../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('schoolStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSchoolStore.setState({
      schools: [],
      metrics: { activeStudents: 0, classesCount: 0, eventsCount: 0 },
      loading: false,
      error: null,
    });
  });

  it('should fetch schools successfully', async () => {
    const mockSchools = [{ id: '1', name: 'Escola A' }];
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockSchools });

    await useSchoolStore.getState().fetchSchools();

    expect(api.get).toHaveBeenCalledWith('/academic/schools');
    expect(useSchoolStore.getState().schools).toEqual(mockSchools);
    expect(useSchoolStore.getState().loading).toBe(false);
  });

  it('should handle fetch schools error', async () => {
    vi.mocked(api.get).mockRejectedValueOnce({ message: 'Network Error' });

    await useSchoolStore.getState().fetchSchools();

    expect(useSchoolStore.getState().error).toBe('Network Error');
    expect(useSchoolStore.getState().loading).toBe(false);
  });

  it('should add a school successfully', async () => {
    const newSchool = { name: 'Escola New', cnpj: '123', isMatrix: false };
    const savedSchool = { id: '2', ...newSchool };
    vi.mocked(api.post).mockResolvedValueOnce({ data: savedSchool });

    await useSchoolStore.getState().addSchool(newSchool);

    expect(api.post).toHaveBeenCalledWith('/academic/schools', newSchool);
    expect(useSchoolStore.getState().schools).toContainEqual(savedSchool);
  });

  it('should fetch metrics successfully', async () => {
    const mockMetrics = { activeStudents: 10, classesCount: 2, eventsCount: 5 };
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockMetrics });

    await useSchoolStore.getState().fetchMetrics('1');

    expect(api.get).toHaveBeenCalledWith('/academic/schools/1/metrics');
    expect(useSchoolStore.getState().metrics).toEqual(mockMetrics);
  });
});
