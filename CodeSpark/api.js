const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async logout() {
    await this.request('/auth/logout', {
      method: 'POST',
    });
    this.setToken(null);
  }

  async verifyToken() {
    return this.request('/auth/verify', {
      method: 'POST',
    });
  }

  // User methods
  async getUsers() {
    return this.request('/users');
  }

  async createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUser(userId) {
    return this.request(`/users/${userId}`);
  }

  async updateUser(userId, userData) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Project methods
  async getProjects(userId = null) {
    const params = userId ? `?user_id=${userId}` : '';
    return this.request(`/projects${params}`);
  }

  async createProject(projectData) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async getProject(projectId) {
    return this.request(`/projects/${projectId}`);
  }

  async updateProject(projectId, projectData) {
    return this.request(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  }

  async deleteProject(projectId) {
    return this.request(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  async getProjectTree(projectId) {
    return this.request(`/projects/${projectId}/tree`);
  }

  // File methods
  async getProjectFiles(projectId) {
    return this.request(`/projects/${projectId}/files`);
  }

  async createFile(fileData) {
    return this.request('/projects/files', {
      method: 'POST',
      body: JSON.stringify(fileData),
    });
  }

  async getFile(fileId) {
    return this.request(`/files/${fileId}`);
  }

  async updateFile(fileId, fileData) {
    return this.request(`/files/${fileId}`, {
      method: 'PUT',
      body: JSON.stringify(fileData),
    });
  }

  async deleteFile(fileId) {
    return this.request(`/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  // AI methods
  async aiChat(chatData) {
    return this.request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(chatData),
    });
  }

  async generateCode(generationData) {
    return this.request('/ai/code-generation', {
      method: 'POST',
      body: JSON.stringify(generationData),
    });
  }

  async analyzeCode(analysisData) {
    return this.request('/ai/code-analysis', {
      method: 'POST',
      body: JSON.stringify(analysisData),
    });
  }

  async getAISessions(userId = null, projectId = null) {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId);
    if (projectId) params.append('project_id', projectId);
    
    const queryString = params.toString();
    return this.request(`/ai/sessions${queryString ? `?${queryString}` : ''}`);
  }

  async getAISession(sessionId) {
    return this.request(`/ai/sessions/${sessionId}`);
  }
}

export default new ApiService();

