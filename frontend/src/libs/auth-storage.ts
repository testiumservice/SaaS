import { Cliente } from './types';

const TOKEN_KEY = 'citas_app_token';
const CLIENTE_KEY = 'citas_app_cliente';

export function setSesion(token: string, cliente: Cliente) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(CLIENTE_KEY, JSON.stringify(cliente));
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getCliente(): Cliente | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(CLIENTE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearSesion() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CLIENTE_KEY);
}