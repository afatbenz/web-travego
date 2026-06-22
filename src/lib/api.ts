export type ApiResponse<T> = {
  status: 'success' | 'error';
  statusCode: number;
  data?: T;
  message?: string;
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3100/api';

export { BASE_URL };
import { showAlert, showApi404Alert } from '@/hooks/use-alert';
import Swal from 'sweetalert2';

const FILE_BASE_URL = (() => {
  const explicit = import.meta.env.VITE_FILE_BASE_URL;
  if (typeof explicit === 'string' && explicit.trim()) return explicit.replace(/\/+$/, '');
  return BASE_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '');
})();

export function toFileUrl(value: string): string {
  if (!value) return '';
  if (/^(https?:)?\/\//i.test(value) || value.startsWith('blob:') || value.startsWith('data:')) return value;
  const clean = value.replace(/^\/+/, '');
  return `${FILE_BASE_URL}/${clean}`;
}

function toApiUrl(path: string): string {
  if (/^(https?:)?\/\//i.test(path)) return path;
  if (path.startsWith('/')) return `${BASE_URL}${path}`;
  return `${BASE_URL}/${path}`;
}

function extractMessage(payload: unknown): string | undefined {
  if (payload && typeof payload === 'object') {
    const msg = (payload as Record<string, unknown>).message;
    return typeof msg === 'string' ? msg : undefined;
  }
  return undefined;
}

function extractData<T>(payload: unknown): T | undefined {
  if (payload && typeof payload === 'object') {
    const data = (payload as Record<string, unknown>).data as unknown;
    if (data !== undefined) return data as T;
  }
  return payload as T;
}

// --- Refresh token logic ---

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;
const inFlightGetRequests = new Map<string, Promise<ApiResponse<unknown>>>();

function normalizeHeaders(headers?: Record<string, string>): Record<string, string> {
  if (!headers) return {};
  return Object.fromEntries(
    Object.entries(headers)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)]),
  );
}

function getRequestKey(path: string, init?: RequestInit): string {
  const method = (init?.method ?? 'GET').toUpperCase();
  const headers = normalizeHeaders(init?.headers as Record<string, string> | undefined);
  const body = init?.body instanceof FormData ? '[formdata]' : typeof init?.body === 'string' ? init.body : '';
  return JSON.stringify({ method, path, headers, body });
}

function clearInFlightGetRequest(key: string): void {
  inFlightGetRequests.delete(key);
}

/**
 * Attempt to refresh the access token using the stored refresh_token.
 * Returns true if refresh succeeded, false otherwise.
 */
async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return false;

  try {
    const res = await fetch(toApiUrl('/auth/refresh'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return false;

    const json = (await res.json()) as Record<string, unknown>;
    const data = json.data as Record<string, unknown> | undefined;
    const newToken = data?.token as string | undefined;
    const newRefreshToken = data?.refresh_token as string | undefined;

    if (newToken && newRefreshToken) {
      localStorage.setItem('token', newToken);
      localStorage.setItem('refresh_token', newRefreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Coordinate refresh attempts so only one is in-flight at a time.
 * All concurrent 401 responses wait on the same promise.
 */
function refreshTokenOnce(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = tryRefreshToken().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });
  return refreshPromise;
}

/** Redirect to login page and clear auth state. */
function redirectToLogin(): void {
  const currentPath = window.location.pathname + window.location.search;
  if (!currentPath.includes('/auth/login')) {
    localStorage.setItem('redirect_path', currentPath);
  }
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  window.location.href = '/auth/login';
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const isGetRequest = method === 'GET';
  const requestKey = isGetRequest ? getRequestKey(path, init) : '';

  if (isGetRequest) {
    const existing = inFlightGetRequests.get(requestKey);
    if (existing) return existing as Promise<ApiResponse<T>>;
  }

  const requestPromise = (async () => {
    try {
      const defaultHeaders: Record<string, string> = { Accept: 'application/json' };
      if (init?.body !== undefined && !(init.body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json';
      }

      const token = localStorage.getItem('token');
      const passedAuth = (init?.headers as Record<string, string> | undefined)?.['Authorization'];

      if (passedAuth) {
        if (!passedAuth.startsWith('Bearer ')) {
          defaultHeaders['Authorization'] = `Bearer ${passedAuth}`;
        } else {
          defaultHeaders['Authorization'] = passedAuth;
        }
      } else if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
      }

      const mergedHeaders: Record<string, string> = {
        ...defaultHeaders,
        ...(init?.headers as Record<string, string> | undefined) ?? {},
        // Ensure Authorization from defaultHeaders (with Bearer) takes precedence if it was missing Bearer
        ...(defaultHeaders['Authorization'] ? { Authorization: defaultHeaders['Authorization'] } : {}),
      };
      if (init?.body !== undefined && !(init.body instanceof FormData)) {
        mergedHeaders['Content-Type'] = 'application/json';
      }

      const res = await fetch(toApiUrl(path), {
        ...init,
        headers: mergedHeaders,
      });

      let json: unknown = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }

      if (res.ok) {
        return {
          status: 'success',
          statusCode: 200,
          data: extractData<T>(json),
          message: extractMessage(json),
        };
      }

      if (res.status === 400) {
        const message = extractMessage(json) ?? 'Bad request';
        if (
          message === 'DOWN_PAYMENT_NOT_FOUND' ||
          message === 'DOWN_PAYMENT_ALREADY_EXIST' ||
          message === 'PAYMENT_AMOUNT_UNREACHABLE' ||
          message === 'PAYMENT_AMOUNT_MAX_EXCEEDED'
        ) {
          return { status: 'error', statusCode: 400, message };
        }
        Swal.fire({
          icon: 'warning',
          title: 'Permintaan tidak valid',
          text: message,
        });
        return { status: 'error', statusCode: 400, message };
      }

      if (res.status === 401) {
        const isAuthEndpoint = path.startsWith('/auth/');
        if (!isAuthEndpoint) {
          const refreshed = await refreshTokenOnce();
          if (refreshed) {
            const newToken = localStorage.getItem('token');
            const retryHeaders: Record<string, string> = {
              ...mergedHeaders,
              Authorization: `Bearer ${newToken}`,
            };
            return request<T>(path, { ...init, headers: retryHeaders });
          }
        }

        await Swal.fire({
          icon: 'warning',
          title: 'Sesi Habis',
          text: 'Sesi Anda telah berakhir. Anda akan dialihkan ke halaman login.',
          timer: 5000,
          timerProgressBar: true,
          showConfirmButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false
        });

        redirectToLogin();
        return { status: 'error', statusCode: 401, message: 'Unauthorized' };
      }

      if (res.status === 500) {
        Swal.fire({
          icon: 'error',
          title: 'Kesalahan Server',
          text: 'Sepertinya ada masalah pada server. Ulangi beberapa saat lagi',
        });
        return { status: 'error', statusCode: 500, message: 'terjadi kesalahan' };
      }

      if (res.status === 404) {
        const fallbackMessage = extractMessage(json) ?? res.statusText ?? 'terjadi kesalahan';
        showApi404Alert();
        return { status: 'error', statusCode: 404, message: fallbackMessage };
      }

      const fallbackMessage = extractMessage(json) ?? res.statusText ?? 'terjadi kesalahan';
      showAlert({ title: 'Gagal', description: fallbackMessage, type: 'error' });
      return { status: 'error', statusCode: res.status, message: fallbackMessage };
    } catch {
      showAlert({ title: 'Jaringan bermasalah', description: 'terjadi kesalahan', type: 'error' });
      return { status: 'error', statusCode: 0, message: 'terjadi kesalahan' };
    } finally {
      if (isGetRequest) clearInFlightGetRequest(requestKey);
    }
  })();

  if (isGetRequest) {
    inFlightGetRequests.set(requestKey, requestPromise as Promise<ApiResponse<unknown>>);
  }

  return requestPromise as Promise<ApiResponse<T>>;
}

export const api = {
  get: <T>(path: string, headers?: Record<string, string>) =>
    request<T>(path, { method: 'GET', headers }),

  post: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
      headers,
    }),

  put: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>(path, {
      method: 'PUT',
      body: body instanceof FormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
      headers,
    }),

  delete: <T>(path: string, headers?: Record<string, string>) =>
    request<T>(path, { method: 'DELETE', headers }),
};

export { request };
export type UploadCommonResponse = { files?: string[]; count?: number; first_url?: string };
export { toApiUrl };

async function postMultipart<T>(path: string, formData: FormData, headers?: Record<string, string>): Promise<ApiResponse<T>> {
  try {
    const mergedHeaders: Record<string, string> = {
      ...(headers ?? {}),
    };

    const res = await fetch(toApiUrl(path), {
      method: 'POST',
      headers: mergedHeaders,
      body: formData,
    });

    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    if (res.ok) {
      return {
        status: 'success',
        statusCode: 200,
        data: extractData<T>(json),
      };
    }

    if (res.status === 400 && toApiUrl(path).endsWith('/api/common/upload')) {
      const message = extractMessage(json) ?? 'Bad request';
      Swal.fire({
        icon: 'warning',
        title: 'Upload gagal',
        text: message,
      });
      return { status: 'error', statusCode: 400, message };
    }

    if (res.status === 404) {
      const fallbackMessage = extractMessage(json) ?? res.statusText ?? 'terjadi kesalahan';
      showApi404Alert();
      return { status: 'error', statusCode: 404, message: fallbackMessage };
    }

    const fallbackMessage = extractMessage(json) ?? res.statusText ?? 'terjadi kesalahan';
    showAlert({ title: 'Gagal', description: fallbackMessage, type: 'error' });
    return { status: 'error', statusCode: res.status, message: fallbackMessage };
  } catch {
    showAlert({ title: 'Jaringan bermasalah', description: 'terjadi kesalahan', type: 'error' });
    return { status: 'error', statusCode: 0, message: 'terjadi kesalahan' };
  }
}

export async function uploadCommon(type: 'armada' | 'package' | 'bank' | 'avatar' | 'employee_photo' | 'payment', files: File[], token?: string) {
  const fd = new FormData();
  fd.append('type', type);
  files.forEach((f) => fd.append('files', f));
  const auth = token ?? (localStorage.getItem('token') ?? '');
  return postMultipart<UploadCommonResponse>('/common/upload', fd, auth ? { Authorization: auth } : undefined);
}

export async function deleteCommon(paths: string[], token?: string) {
  const auth = token ?? (localStorage.getItem('token') ?? '');
  return api.post<unknown>('/common/delete-files', { files: paths }, auth ? { Authorization: auth } : undefined);
}
