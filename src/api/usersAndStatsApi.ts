import { apiClient } from './client';
import { User, UserRole, DashboardStats } from '../types';

export const usersApi = {
  async getAll(): Promise<User[]> {
    const response = await apiClient.get<User[]>('/users');
    return response.data;
  },

  async updateRole(userId: string, role: UserRole): Promise<User> {
    const response = await apiClient.patch<User>(`/users/${userId}/role`, { role });
    return response.data;
  },

  async delete(userId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `/users/${userId}`
    );
    return response.data;
  },
};

export const statsApi = {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>('/stats');
    return response.data;
  },
};
