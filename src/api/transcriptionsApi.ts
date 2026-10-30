import { apiClient } from './client';
import { Transcription, SaveRevisionDto } from '../types';

export const transcriptionsApi = {
  async getByPageId(pageId: string): Promise<Transcription> {
    const response = await apiClient.get<Transcription>(`/transcriptions/page/${pageId}`);
    return response.data;
  },

  async getById(id: string): Promise<Transcription> {
    const response = await apiClient.get<Transcription>(`/transcriptions/${id}`);
    return response.data;
  },

  async saveRevision(transcriptionId: string, dto: SaveRevisionDto): Promise<Transcription> {
    const response = await apiClient.post<Transcription>(
      `/transcriptions/${transcriptionId}/revisions`,
      dto
    );
    return response.data;
  },

  async updateStatus(
    transcriptionId: string,
    status: 'reviewed' | 'approved'
  ): Promise<Transcription> {
    const response = await apiClient.patch<Transcription>(
      `/transcriptions/${transcriptionId}/status`,
      { status }
    );
    return response.data;
  },
};
