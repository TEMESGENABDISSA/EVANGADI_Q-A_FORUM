import config from '../config';

class ApiService {
  constructor() {
    this.baseUrl = config.apiBaseUrl;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...config.defaultRequestConfig,
      ...options,
      headers: {
        ...config.defaultRequestConfig.headers,
        ...(options.headers || {}),
      },
    };

    try {
      const response = await fetch(url, config);
      
      // Handle 204 No Content responses
      if (response.status === 204) {
        return { success: true };
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth methods
  login = (credentials) => {
    return this.request(config.endpoints.auth.login, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  };

  register = (userData) => {
    return this.request(config.endpoints.auth.register, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  };

  checkAuth = () => {
    return this.request(config.endpoints.auth.check, {
      credentials: 'include',
    });
  };

  // Question methods
  getQuestions = () => {
    return this.request(config.endpoints.questions.getAll);
  };

  getQuestionById = (id) => {
    return this.request(config.endpoints.questions.getById(id));
  };

  // Answer methods
  getAnswers = (questionId) => {
    return this.request(config.endpoints.answers.getByQuestion(questionId));
  };

  postAnswer = (answerData) => {
    return this.request(config.endpoints.answers.create, {
      method: 'POST',
      body: JSON.stringify(answerData),
    });
  };

  // Notification methods
  getNotifications = (userId) => {
    return this.request(config.endpoints.notifications.getByUser(userId));
  };

  getUnreadNotificationCount = (userId) => {
    return this.request(config.endpoints.notifications.getUnreadCount(userId));
  };
}

const api = new ApiService();
export default api;
