export type ApiResponse<T> = {
  status: 'success' | 'error';
  statusCode: number;
  data?: T;
  message?: string;
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3100/api';
import { showAlert } from '@/hooks/use-alert';
import Swal from 'sweetalert2';

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
    if (init?.body !== undefined && !(init.body instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json';
    }
    const mergedHeaders: Record<string, string> = {
      ...defaultHeaders,
      ...(init?.headers as Record<string, string> | undefined) ?? {},
    };
    if (init?.body !== undefined && !(init.body instanceof FormData)) {
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
      Swal.fire({
        icon: 'warning',
        title: 'Permintaan tidak valid',
        text: message,
      });
      return { status: 'error', statusCode: 400, message };
    }

    if (res.status === 401) {
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
      
      const currentPath = window.location.pathname + window.location.search;
      if (!currentPath.includes('/auth/login')) {
        localStorage.setItem('redirect_path', currentPath);
      }
      
      window.location.href = '/auth/login';
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

async function postMultipart<T>(path: string, formData: FormData, headers?: Record<string, string>): Promise<ApiResponse<T>> {
  try {
    const mergedHeaders: Record<string, string> = {
      ...(headers ?? {}),
    };

    const res = await fetch(`${BASE_URL}${path}`, {
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

    const fallbackMessage = extractMessage(json) ?? res.statusText ?? 'terjadi kesalahan';
    showAlert({ title: 'Gagal', description: fallbackMessage, type: 'error' });
    return { status: 'error', statusCode: res.status, message: fallbackMessage };
  } catch {
    showAlert({ title: 'Jaringan bermasalah', description: 'terjadi kesalahan', type: 'error' });
    return { status: 'error', statusCode: 0, message: 'terjadi kesalahan' };
  }
}

export async function uploadCommon(type: 'armada' | 'package' | 'bank', files: File[], token?: string) {
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
