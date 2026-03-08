import type { ApiError } from '../types/api'

const baseUrl = import.meta.env.VITE_API_URL ?? ''

export class ApiRequestError extends Error implements ApiError {
  status: number
  details?: unknown

  constructor(error: ApiError) {
    super(error.message)
    this.name = 'ApiRequestError'
    this.status = error.status
    this.details = error.details
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let details: unknown

    try {
      details = await response.json()
    } catch {
      details = undefined
    }

    throw new ApiRequestError({
      message: `Request failed with status ${response.status}`,
      status: response.status,
      details,
    })
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)

  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
    })

    return handleResponse<T>(response)
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error
    }

    throw new ApiRequestError({
      message: 'Network request failed',
      status: 0,
      details: error,
    })
  }
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T, B>(path: string, body: B) =>
    request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  put: <T, B>(path: string, body: B) =>
    request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  patch: <T, B>(path: string, body: B) =>
    request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  delete: <T>(path: string) =>
    request<T>(path, {
      method: 'DELETE',
    }),
}
