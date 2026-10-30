import { apiClient } from './client';
import { RecognitionJob, CreateJobDto, JobStatus, PaginatedResponse } from '../types';

export interface JobFilterParams {
  status?: JobStatus;
  manuscriptId?: string;
  language?: string;
  modelName?: string;
  page?: number;
  limit?: number;
}

export const jobsApi = {
  async getAll(params?: JobFilterParams): Promise<PaginatedResponse<RecognitionJob>> {
    const response = await apiClient.get<PaginatedResponse<RecognitionJob>>('/jobs', {
      params,
    });
    return response.data;
  },

  async getById(id: string): Promise<RecognitionJob> {
    const response = await apiClient.get<RecognitionJob>(`/jobs/${id}`);
    return response.data;
  },

  async createJob(dto: CreateJobDto): Promise<RecognitionJob> {
    const response = await apiClient.post<RecognitionJob>('/jobs', dto);
    return response.data;
  },

  async retryJob(id: string): Promise<RecognitionJob> {
    const response = await apiClient.post<RecognitionJob>(`/jobs/${id}/retry`);
    return response.data;
  },

  async cancelJob(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(`/jobs/${id}/cancel`);
    return response.data;
  },

  async getAvailableModels(): Promise<Array<{ id: string; name: string; description: string; version: string; default: boolean }>> {
    const response = await apiClient.get('/jobs/models');
    return response.data;
  },
};
