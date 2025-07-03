// frontend/src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Categories API
  async getCategories() {
    return this.request('/api/categories');
  }

  async createCategory(categoryData) {
    return this.request('/api/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async updateCategory(id, categoryData) {
    return this.request(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  async deleteCategory(id) {
    return this.request(`/api/categories/${id}`, {
      method: 'DELETE',
    });
  }

  async resetDefaultCategories() {
    return this.request('/api/categories/reset-defaults', {
      method: 'POST',
    });
  }

  // Tasks API
  async getTasks(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/tasks?${queryString}` : '/api/tasks';
    return this.request(endpoint);
  }

  async getTask(id) {
    return this.request(`/api/tasks/${id}`);
  }

  async createTask(taskData) {
    return this.request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(id, taskData) {
    return this.request(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
  }

  async deleteTask(id) {
    return this.request(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async updateTaskStatus(id, status) {
    return this.request(`/api/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async updateTaskPriority(id, priorityRatings) {
    return this.request(`/api/tasks/${id}/priority`, {
      method: 'PATCH',
      body: JSON.stringify({ priorityRatings }),
    });
  }

  async searchTasks(query, limit = 20) {
    return this.request(`/api/tasks/search/${encodeURIComponent(query)}?limit=${limit}`);
  }

  async getTaskStats() {
    return this.request('/api/tasks/stats');
  }

  // Bulk operations
  async bulkUpdateTasks(operation, taskIds, data = {}) {
    return this.request('/api/tasks/bulk', {
      method: 'POST',
      body: JSON.stringify({ operation, taskIds, data }),
    });
  }

  // Data migration
  async exportData() {
    return this.request('/api/data/export');
  }

  async importData(data, options = {}) {
    return this.request('/api/data/import', {
      method: 'POST',
      body: JSON.stringify({ data, options }),
    });
  }

  async migrateFromLocalStorage(localStorageData) {
    return this.request('/api/data/migrate-localstorage', {
      method: 'POST',
      body: JSON.stringify({ localStorageData }),
    });
  }

  async createBackup() {
    return this.request('/api/data/backup');
  }

  async restoreBackup(backup, options = {}) {
    return this.request('/api/data/restore', {
      method: 'POST',
      body: JSON.stringify({ backup, options }),
    });
  }

  async validateData() {
    return this.request('/api/data/validate');
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
