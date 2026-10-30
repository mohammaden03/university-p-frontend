import { apiClient } from './client';
import {
  DatasetItem,
  DatasetSplit,
  DatasetStatus,
  DatasetStatsResponse,
  PaginatedResponse,
} from '../types';

export interface DatasetFilterParams {
  language?: string;
  split?: DatasetSplit;
  status?: DatasetStatus;
  manuscriptId?: string;
  page?: number;
  limit?: number;
}

export const datasetsApi = {
  async getSamples(params?: DatasetFilterParams): Promise<PaginatedResponse<DatasetItem>> {
    const response = await apiClient.get<PaginatedResponse<DatasetItem>>('/datasets/samples', {
      params,
    });
    return response.data;
  },

  async updateSplit(sampleId: string, split: DatasetSplit): Promise<DatasetItem> {
    const response = await apiClient.patch<DatasetItem>(`/datasets/samples/${sampleId}/split`, {
      split,
    });
    return response.data;
  },

  async updateStatus(
    sampleId: string,
    status: DatasetStatus,
    groundTruthText?: string
  ): Promise<DatasetItem> {
    const response = await apiClient.patch<DatasetItem>(`/datasets/samples/${sampleId}/status`, {
      status,
      groundTruthText,
    });
    return response.data;
  },

  async getStats(): Promise<DatasetStatsResponse> {
    const response = await apiClient.get<DatasetStatsResponse>('/datasets/stats');
    return response.data;
  },

  async exportDataset(format: 'json' | 'csv' | 'zip' = 'json'): Promise<Blob> {
    const response = await apiClient.get(`/datasets/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },
};
