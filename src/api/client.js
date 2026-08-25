import axios from 'axios';

const TOKEN_KEY = 'barbearia.token';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3333',
});

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Anexa o token em toda requisicao.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Sessão expirada derruba para a tela de login em qualquer lugar do app.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && getToken()) {
      clearToken();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login?expirada=1');
      }
    }
    return Promise.reject(error);
  }
);

/**
 * A API sempre responde erro no formato { error: { code, message, details } }.
 * Aqui isso vira algo que a tela consegue mostrar sem interpretar nada.
 */
export function readError(error) {
  const payload = error?.response?.data?.error;

  if (payload) {
    return {
      code: payload.code,
      message: payload.message,
      fields: Object.fromEntries(
        (payload.details ?? []).map(({ field, message }) => [field, message])
      ),
    };
  }

  if (error?.code === 'ERR_NETWORK') {
    return {
      code: 'SEM_CONEXAO',
      message: 'Não foi possível falar com o servidor. Verifique se a API está no ar.',
      fields: {},
    };
  }

  return { code: 'ERRO', message: 'Algo deu errado. Tente novamente.', fields: {} };
}
