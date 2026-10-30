import { apiClient } from './client';
import {
  Manuscript,
  ManuscriptCreateDto,
  ManuscriptLanguage,
  HistoricalPeriod,
  ScriptType,
  PaginatedResponse,
} from '../types';

export interface ManuscriptFilterParams {
  search?: string;
  language?: ManuscriptLanguage;
  historicalPeriod?: HistoricalPeriod;
  scriptType?: ScriptType;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'title' | 'author';
  sortOrder?: 'asc' | 'desc';
}

export const manuscriptsApi = {
  async getAll(params?: ManuscriptFilterParams): Promise<PaginatedResponse<Manuscript>> {
    const response = await apiClient.get<PaginatedResponse<Manuscript>>('/manuscripts', {
      params,
    });
    return response.data;
  },

  async getById(id: string): Promise<Manuscript> {
    const response = await apiClient.get<Manuscript>(`/manuscripts/${id}`);
    return response.data;
  },

  async create(data: ManuscriptCreateDto): Promise<Manuscript> {
    const response = await apiClient.post<Manuscript>('/manuscripts', data);
    return response.data;
  },

  async update(id: string, data: Partial<ManuscriptCreateDto>): Promise<Manuscript> {
    const response = await apiClient.put<Manuscript>(`/manuscripts/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `/manuscripts/${id}`
    );
    return response.data;
  },
};
