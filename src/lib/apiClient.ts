import { User as FirebaseUser } from 'firebase/auth';

/**
 * Helper function to resolve full API URL based on VITE_API_BASE_URL environment configuration.
 * For same-origin deployments, defaults to relative /api/... paths.
 * For separate frontend/backend deployments, uses configured VITE_API_BASE_URL.
 */
export function getApiUrl(path: string): string {
  let baseUrl = '';
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    } else if (typeof process !== 'undefined' && process.env) {
      baseUrl = process.env.VITE_API_BASE_URL || '';
    }
  } catch {
    baseUrl = '';
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!baseUrl) {
    return cleanPath;
  }
  return `${baseUrl.replace(/\/+$/, '')}${cleanPath}`;
}

/**
 * Calls a OmorfiHub backend API route with the caller's verified Firebase ID
 * token attached, the way every Phase A1-hardened /api/* route expects.
 *
 * IMPORTANT: pass `fbUser` (the raw Firebase Auth user from
 * `useAuth().fbUser`), NOT `user` (the Firestore profile from
 * `useAuth().user`). The Firestore profile object does not have
 * `getIdToken()` -- only the real Firebase Auth user does.
 *
 * Usage:
 *   const { fbUser } = useAuth();
 *   const data = await apiFetch(fbUser, '/api/wallet/withdraw', {
 *     method: 'POST',
 *     body: { amount: 5000 }
 *   });
 */
export async function apiFetch<T = any>(
  fbUser: FirebaseUser | null | undefined,
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: any;
  } = {}
): Promise<T> {
  if (!fbUser) {
    throw new Error('You must be signed in to do this. Please log in and try again.');
  }

  let token: string;
  try {
    token = await fbUser.getIdToken();
  } catch (err) {
    throw new Error('Your session could not be verified. Please log in again.');
  }

  const fullUrl = getApiUrl(path);

  const response = await fetch(fullUrl, {
    method: options.method || (options.body ? 'POST' : 'GET'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON response (e.g. empty body) -- fine for some endpoints.
  }

  if (!response.ok) {
    const message = data?.error || `Request failed (${response.status}). Please try again.`;
    throw new Error(message);
  }

  return data as T;
}
