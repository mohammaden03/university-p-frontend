import { apiClient } from './client';
import { SearchQuery, SearchResponse } from '../types';

export const searchApi = {
  async search(query: SearchQuery): Promise<SearchResponse> {
    const response = await apiClient.get<SearchResponse>('/search', {
      params: query,
    });
    return response.data;
  },
};
