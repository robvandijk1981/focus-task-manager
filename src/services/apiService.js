// API Service for ADHD Task Manager - Cache Bust: 2025-09-04-14:02
// Force cache invalidation with timestamp
const CACHE_BUST_TIMESTAMP = '2025-09-04-14:02:00';
const API_BASE_URL = window.location.origin;

class ApiService {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  // Get authentication headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Make API request
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Handle authentication errors
      if (response.status === 401) {
        // Token expired or invalid, clear it silently
        this.setToken(null);
        // Don't throw error for auth endpoints, let them handle it
        if (endpoint.includes('/auth/')) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Authentication failed');
        }
        throw new Error('Authentication expired. Please log in again.');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection.');
      }
      
      throw error;
    }
  }

  // Authentication methods
  async register(userData) {
    const response = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async login(credentials) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async getCurrentUser() {
    return await this.request('/api/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Track methods
  async getTracks() {
    const response = await this.request('/api/tracks');
    return response.tracks || [];
  }

  async syncTracks(tracks) {
    const response = await this.request('/api/tracks/bulk-sync', {
      method: 'POST',
      body: JSON.stringify({ tracks }),
    });
    return response.tracks || [];
  }

  async createTrack(track) {
    const response = await this.request('/api/tracks', {
      method: 'POST',
      body: JSON.stringify(track),
    });
    return response.track || track;
  }

  async getGoals(trackId) {
    const response = await this.request(`/api/goals?track_id=${trackId}`);
    return response;
  }

  async getTasks(goalId) {
    const response = await this.request(`/api/tasks?goal_id=${goalId}`);
    return response;
  }

  async createGoal(goal) {
    const response = await this.request('/api/goals', {
      method: 'POST',
      body: JSON.stringify(goal),
    });
    return response.goal || goal;
  }

  async createTask(task) {
    const response = await this.request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
    return response.task || task;
  }

  async updateTask(taskId, updates) {
    const response = await this.request(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.task || updates;
  }

  async deleteTask(taskId) {
    const response = await this.request(`/api/tasks/${taskId}`, {
      method: 'DELETE',
    });
    return response;
  }

  // Session methods
  async getSession() {
    // Mock implementation - return default session data
    return { 
      dailyIntention: '',
      energyLevel: 5,
      focusMode: 'normal',
      currentTrackId: null,
      completionStreaks: {}
    };
  }

  async updateSession(sessionData) {
    // Mock implementation - just return the data
    return sessionData;
  }

  async setDailyIntention(intention) {
    // Mock implementation
    return { intention };
  }

  async setEnergyLevel(energyLevel) {
    // Mock implementation
    return { energy_level: energyLevel };
  }

  async toggleFocusMode(focusMode = null) {
    // Mock implementation
    return { focus_mode: focusMode };
  }

  async recordTrackSwitch(trackId) {
    // Mock implementation
    return { track_id: trackId };
  }

  async updateCompletionStreak(action) {
    // Mock implementation
    return { action };
  }

  // Utility methods
  isAuthenticated() {
    return !!this.token;
  }

  // Health check
  async healthCheck() {
    return await this.request('/health');
  }
}

export default new ApiService();

