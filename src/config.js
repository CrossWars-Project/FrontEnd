// API configuration
// eslint-disable-next-line import/prefer-default-export
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
//Only uses deployed backend if VITE_API_URL is explicitly set in .env file