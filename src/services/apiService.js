// API Service for ADHD Task Manager - Cache Bust: 2025-09-04-14:02
// Force cache invalidation with timestamp
const CACHE_BUST_TIMESTAMP = '2025-09-04-14:02:00';
const API_BASE_URL = `${window.location.origin}/api`;

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
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    
    return response;
  }

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    
    return response;
  }

  async getCurrentUser() {
    return await this.request('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Track methods
  async getTracks() {
    const response = await this.request('/tracks');
    return response.tracks || [];
  }

  async syncTracks(tracks) {
    const response = await this.request('/tracks/bulk-sync', {
      method: 'POST',
      body: JSON.stringify({ tracks }),
    });
    return response.tracks || [];
  }

  async createTrack(track) {
    const response = await this.request('/tracks', {
      method: 'POST',
      body: JSON.stringify(track),
    });
    return response.track || track;
  }

  // Session methods
  async getSession() {
    const response = await this.request('/session');
    return response.session || {};
  }

  async updateSession(sessionData) {
    const response = await this.request('/session', {
      method: 'PUT',
      body: JSON.stringify(sessionData),
    });
    return response.session || {};
  }

  async setDailyIntention(intention) {
    return await this.request('/session/daily-intention', {
      method: 'POST',
      body: JSON.stringify({ intention }),
    });
  }

  async setEnergyLevel(energyLevel) {
    return await this.request('/session/energy-level', {
      method: 'POST',
      body: JSON.stringify({ energy_level: energyLevel }),
    });
  }

  async toggleFocusMode(focusMode = null) {
    const body = focusMode !== null ? { focus_mode: focusMode } : {};
    return await this.request('/session/focus-mode', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async recordTrackSwitch(trackId) {
    return await this.request('/session/track-switch', {
      method: 'POST',
      body: JSON.stringify({ track_id: trackId }),
    });
  }

  async updateCompletionStreak(action) {
    return await this.request('/session/completion-streak', {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
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

