import {
  User,
  Project,
  Review,
  DashboardStats,
  ComparisonResult,
  SystemHealth,
} from '../types/index.ts';

// Token storage key
const TOKEN_KEY = 'codesentinel_access_token';
const REFRESH_KEY = 'codesentinel_refresh_token';

export const tokenStorage = {
  getAccessToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
  },
  getRefreshToken(): string | null {
    return sessionStorage.getItem(REFRESH_KEY) || localStorage.getItem(REFRESH_KEY);
  },
  setTokens(access: string, refresh: string, remember = false) {
    if (remember) {
      localStorage.setItem(TOKEN_KEY, access);
      localStorage.setItem(REFRESH_KEY, refresh);
    } else {
      sessionStorage.setItem(TOKEN_KEY, access);
      sessionStorage.setItem(REFRESH_KEY, refresh);
    }
  },
  clearTokens() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

class ApiService {
  private baseUrl = 'https://codesentinel-ai-qrd2.onrender.com/api/v1';

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = tokenStorage.getAccessToken();

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 token expiry by trying refresh once
      if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry original request with new token
          headers['Authorization'] = `Bearer ${tokenStorage.getAccessToken()}`;
          const retryRes = await fetch(url, { ...options, headers });
          const retryData = await retryRes.json();
          if (!retryRes.ok) throw new Error(retryData.error || 'Request failed');
          return retryData.data;
        } else {
          tokenStorage.clearTokens();
          window.dispatchEvent(new Event('auth:unauthorized'));
        }
      }

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || `HTTP ${response.status}: Request failed`);
      }

      return resData.data;
    } catch (err: any) {
      throw new Error(err.message || 'Network communication error');
    }
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return false;
      const data = await res.json();
      if (data.data?.accessToken) {
        tokenStorage.setTokens(data.data.accessToken, data.data.refreshToken || refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Health
  async getHealth(): Promise<SystemHealth> {
    return this.request<SystemHealth>('/health');
  }

  // Auth
  async register(data: { name: string; email: string; password: string }): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }, remember = false): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }> {
    const res = await this.request<{ user: User; tokens: { accessToken: string; refreshToken: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    tokenStorage.setTokens(res.tokens.accessToken, res.tokens.refreshToken, remember);
    return res;
  }

  async logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } finally {
      tokenStorage.clearTokens();
    }
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects');
  }

  async createProject(data: { name: string; description?: string; repositoryUrl?: string; primaryLanguage?: string; tags?: string[] }): Promise<Project> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProject(id: string): Promise<{ project: Project; reviews: Review[] }> {
    return this.request<{ project: Project; reviews: Review[] }>(`/projects/${id}`);
  }

  async deleteProject(id: string): Promise<void> {
    await this.request(`/projects/${id}`, { method: 'DELETE' });
  }

  // Code & Project Analysis
  async analyzeCode(data: { code: string; language: string; title?: string; projectId?: string }): Promise<{ review: Review; redactionInfo?: any }> {
    return this.request<{ review: Review; redactionInfo?: any }>('/analysis/code', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async analyzeProjectUpload(file: File, projectName: string, projectId?: string): Promise<{ review: Review; projectStats: any }> {
    const formData = new FormData();
    formData.append('archive', file);
    formData.append('projectName', projectName);
    if (projectId) formData.append('projectId', projectId);

    return this.request<{ review: Review; projectStats: any }>('/analysis/project-upload', {
      method: 'POST',
      body: formData,
    });
  }

  // Reviews
  async getReviews(params?: { projectId?: string; language?: string }): Promise<Review[]> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request<Review[]>(`/reviews${query ? `?${query}` : ''}`);
  }

  async getReview(id: string): Promise<Review> {
    return this.request<Review>(`/reviews/${id}`);
  }

  async deleteReview(id: string): Promise<void> {
    await this.request(`/reviews/${id}`, { method: 'DELETE' });
  }

  async compareReviews(baselineId: string, targetId: string): Promise<ComparisonResult> {
    return this.request<ComparisonResult>('/reviews/compare', {
      method: 'POST',
      body: JSON.stringify({ baselineId, targetId }),
    });
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/dashboard/stats');
  }
}

export const api = new ApiService();
