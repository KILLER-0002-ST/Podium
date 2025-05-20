import axios from 'axios'
import { QueryClient } from '@tanstack/react-query'
import { env } from './env'
import Cookies from 'js-cookie'
import { CSRF_TOKEN } from './constants'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false },
  },
})

export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Origin': env.NEXT_PUBLIC_ORIGIN_URL,
    'Referer': env.NEXT_PUBLIC_REFERER_URL,
  },
})

apiClient.interceptors.request.use(
  (config) => {
    // Get CSRF token from cookies before each request
    const csrfToken = Cookies.get(CSRF_TOKEN);
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    
    // Ensure Origin and Referer headers are always present
    config.headers['Origin'] = env.NEXT_PUBLIC_ORIGIN_URL;
    config.headers['Referer'] = env.NEXT_PUBLIC_REFERER_URL;
    
    // console.log('Request URL:', config.url);
    // console.log('Request Headers:', config.headers);
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
