export type ApiResponse<T> = {
  status: 'success' | 'error';
  statusCode: number;
  data?: T;
  message?: string;
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
import { showAlert } from '@/hooks/use-alert';

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

async function request<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const defaultHeaders: Record<string, string> = { Accept: 'application/json' };
    if (init?.body !== undefined) {
      defaultHeaders['Content-Type'] = 'application/json';
    }
    const mergedHeaders: Record<string, string> = {
      ...defaultHeaders,
      ...(init?.headers as Record<string, string> | undefined) ?? {},
    };
    if (init?.body !== undefined) {
      mergedHeaders['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${BASE_URL}${path}`, {
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
      };
    }

    if (res.status === 400) {
      const message = extractMessage(json) ?? 'Bad request';
      showAlert({ title: 'Permintaan tidak valid', description: message, type: 'warning' });
      return { status: 'error', statusCode: 400, message };
    }

    if (res.status === 500) {
      showAlert({ title: 'Kesalahan Server', description: 'terjadi kesalahan', type: 'error' });
      return { status: 'error', statusCode: 500, message: 'terjadi kesalahan' };
    }

    const fallbackMessage = extractMessage(json) ?? res.statusText ?? 'terjadi kesalahan';
    showAlert({ title: 'Gagal', description: fallbackMessage, type: 'error' });
    return { status: 'error', statusCode: res.status, message: fallbackMessage };
  } catch {
    showAlert({ title: 'Jaringan bermasalah', description: 'terjadi kesalahan', type: 'error' });
    return { status: 'error', statusCode: 0, message: 'terjadi kesalahan' };
  }
}

export const api = {
  get: <T>(path: string, headers?: Record<string, string>) =>
    request<T>(path, { method: 'GET', headers }),

  post: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers,
    }),

  put: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers,
    }),

  delete: <T>(path: string, headers?: Record<string, string>) =>
    request<T>(path, { method: 'DELETE', headers }),
};

export { request };
