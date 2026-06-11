import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { useSystemStore } from '@/store/systemStore';

// Si estamos en producción, usamos Render. Si estamos en desarrollo, usamos la IP local.
const isProd = import.meta.env.PROD;

export const api = axios.create({
  baseURL: isProd 
    ? 'https://pool-worldcup-core.onrender.com/api' 
    : `http://${window.location.hostname}:3000/api`,
  timeout: 10000, // 10s timeout
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Si la petición es exitosa, quitamos el modal de waking up
    useSystemStore.getState().setIsWakingUp(false);
    return response;
  },
  async (error) => {
    const config = error.config;
    if (!config) return Promise.reject(error);

    config.retryCount = config.retryCount || 0;

    // Detectamos si es por timeout o error 5xx de Render apagado
    const isColdStartError = 
      error.code === 'ECONNABORTED' || 
      !error.response || 
      (error.response.status >= 502 && error.response.status <= 504);

    if (isColdStartError && config.retryCount < 4) {
      config.retryCount += 1;
      
      // Mostrar el modal
      useSystemStore.getState().setIsWakingUp(true);

      // Esperar 5 segundos antes de reintentar
      await new Promise(resolve => setTimeout(resolve, 5000));
      return api(config);
    }

    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    
    // Si hay un error diferente o ya agotamos los intentos, cerramos el modal
    useSystemStore.getState().setIsWakingUp(false);
    return Promise.reject(error);
  }
);
