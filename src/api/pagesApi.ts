import { apiClient } from './client';
import { ManuscriptPage } from '../types';

export interface PageUploadParams {
  manuscriptId: string;
  pageNumber: number;
  imageUrl?: string;
  file?: File;
  notes?: string;
}

export const pagesApi = {
  async getByManuscriptId(manuscriptId: string): Promise<ManuscriptPage[]> {
    const response = await apiClient.get<ManuscriptPage[]>(`/manuscripts/${manuscriptId}/pages`);
    return response.data;
  },

  async getById(id: string): Promise<ManuscriptPage> {
    const response = await apiClient.get<ManuscriptPage>(`/pages/${id}`);
    return response.data;
  },

  async uploadPage(data: PageUploadParams): Promise<ManuscriptPage> {
    if (data.file) {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('manuscriptId', data.manuscriptId);
      formData.append('pageNumber', String(data.pageNumber));
      if (data.notes) formData.append('notes', data.notes);

      const response = await apiClient.post<ManuscriptPage>(
        `/manuscripts/${data.manuscriptId}/pages/upload`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      return response.data;
    }

    const response = await apiClient.post<ManuscriptPage>(
      `/manuscripts/${data.manuscriptId}/pages`,
      {
        pageNumber: data.pageNumber,
        imageUrl: data.imageUrl,
        notes: data.notes,
      }
    );
    return response.data;
  },

  async delete(pageId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/pages/${pageId}`);
    return response.data;
  },
};
