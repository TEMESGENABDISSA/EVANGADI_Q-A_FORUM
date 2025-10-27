const config = {
  // API Base URL
  apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1',
  
  // API Endpoints
  endpoints: {
    auth: {
      login: '/user/login',
      register: '/user/register',
      check: '/user/check',
      forgotPassword: '/user/forgotPassword',
      resetPassword: '/user/resetPassword',
    },
    questions: {
      getAll: '/questions',
      getById: (id) => `/questions/${id}`,
      create: '/questions',
      update: (id) => `/questions/${id}`,
      delete: (id) => `/questions/${id}`,
    },
    answers: {
      getByQuestion: (questionId) => `/answer/${questionId}`,
      create: '/answer',
      vote: '/answer/vote',
      edit: '/answer',
      delete: '/answer',
      accept: '/answer/accept',
    },
    notifications: {
      getByUser: (userId) => `/notifications/${userId}`,
      getUnreadCount: (userId) => `/notifications/${userId}/unread-count`,
      markAsRead: (notificationId) => `/notifications/${notificationId}/read`,
    },
  },

  // Default request configuration
  defaultRequestConfig: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    credentials: 'include', // Important for sending cookies with cross-origin requests
  },
};

export default config;
