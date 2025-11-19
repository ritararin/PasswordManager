import axios, { AxiosInstance } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    console.log('Making request to:', config.url);
    console.log('Token from storage:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Authorization header set');
    } else {
      console.warn('NO TOKEN - Request will fail!');
    }
    return config;
  },
  (error) => Promise.reject(error)
);
  }

  get instance() {
    return this.api;
  }
}

const apiService = new ApiService();

export interface User {
  id: number;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Password {
  id: number;
  service_name: string;
  website_url?: string;
  username?: string;
  email_address?: string;
  notes?: string;
  category: string;
  is_weak: boolean;
  is_reused: boolean;
  created_at: string;
  updated_at: string;
  last_used?: string;
  password?: string;
}

export interface SecurityHealth {
  total_passwords: number;
  weak_passwords: number;
  reused_passwords: number;
  security_score: number;
}

export const authService = {
  async register(email: string, password: string) {
  const response = await apiService.instance.post('/auth/register', {
    email,
    password,
  });
  
  // Debug log
  console.log('Register API response:', response.data);
  
  const token = response.data.access_token;
  if (token) {
    localStorage.setItem('access_token', token);
    console.log('Token saved:', token);
  } else {
    console.error('No access_token in response!');
  }
  
  return response.data;
},

 async login(email: string, password: string) {
  console.log('=== LOGIN START ===');
  console.log('Sending login request...');
  
  const response = await apiService.instance.post('/auth/login', {
    email,
    password,
  });
  
  console.log('Full response:', response);
  console.log('Response data:', response.data);
  console.log('Access token from response:', response.data.access_token);
  
  const token = response.data.access_token;
  if (token) {
    console.log('Saving token to localStorage...');
    localStorage.setItem('access_token', token);
    console.log('Token saved. Verifying...');
    console.log('Token from localStorage:', localStorage.getItem('access_token'));
  } else {
    console.error('ERROR: No access_token in response data!');
    console.error('Response data keys:', Object.keys(response.data));
  }
  
  console.log('=== LOGIN END ===');
  return response.data;
},

  logout() {
    localStorage.removeItem('access_token');
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiService.instance.get('/auth/me');
    return response.data.user;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },
};

export const passwordService = {
  async getAll(filters?: { category?: string; search?: string }): Promise<Password[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    
    const queryString = params.toString();
    const url = queryString ? `/passwords/?${queryString}` : '/passwords/';
    const response = await apiService.instance.get(url);
    return response.data.passwords;
  },

  async getById(id: number): Promise<Password> {
    const response = await apiService.instance.get(`/passwords/${id}/`);
    return response.data;
  },

  async create(data: {
    service_name: string;
    password: string;
    website_url?: string;
    username?: string;
    email_address?: string;
    notes?: string;
    category?: string;
  }): Promise<Password> {
    const response = await apiService.instance.post('/passwords/', data);
    return response.data.password;
  },

  async update(id: number, data: Partial<Password>): Promise<Password> {
    const response = await apiService.instance.put(`/passwords/${id}/`, data);
    return response.data.password;
  },

  async delete(id: number): Promise<void> {
    await apiService.instance.delete(`/passwords/${id}/`);
  },

  async getSecurityHealth(): Promise<SecurityHealth> {
    const response = await apiService.instance.get('/passwords/security-health/');
    return response.data;
  },

  async generatePassword(length: number = 16, includeSpecial: boolean = true): Promise<string> {
    const response = await apiService.instance.get('/passwords/generate/', {
      params: { length, include_special: includeSpecial },
    });
    return response.data.password;
  },
};

export default apiService;