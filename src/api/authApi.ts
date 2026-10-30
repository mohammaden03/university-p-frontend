import { apiClient, setStoredToken } from './client';
import { AuthResponse, LoginDto, RegisterDto, User } from '../types';

export const authApi = {
  async login(credentials: LoginDto): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    if (response.data.accessToken) {
      setStoredToken(response.data.accessToken);
    }
    return response.data;
  },

  async register(data: RegisterDto): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    if (response.data.accessToken) {
      setStoredToken(response.data.accessToken);
    }
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      setStoredToken(null);
    }
  },

  async refreshToken(): Promise<{ accessToken: string }> {
    const response = await apiClient.post<{ accessToken: string }>('/auth/refresh');
    if (response.data.accessToken) {
      setStoredToken(response.data.accessToken);
    }
    return response.data;
  },
};
