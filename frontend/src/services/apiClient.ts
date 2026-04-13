import { toast } from 'sonner'
import { getSession } from '../lib/auth'
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

function extractErrorMessage(details: unknown, status: number): string {
  if (details && typeof details === 'object') {
    const obj = details as Record<string, unknown>
    if (typeof obj.message === 'string' && obj.message.length > 0) return obj.message
    if (typeof obj.error === 'string' && obj.error.length > 0) return obj.error
  }
  if (status === 401) return 'Session expired. Please log in again.'
  if (status === 403) return 'You do not have permission to perform this action.'
  if (status === 404) return 'The requested resource was not found.'
  if (status === 409) return 'This action conflicts with the current state.'
  return `Something went wrong (${status}). Please try again.`
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let details: unknown

    try {
      details = await response.json()
    } catch {
      details = undefined
    }

    const userMessage = extractErrorMessage(details, response.status)
    toast.error(userMessage, { id: `api-error-${response.status}-${userMessage}` })

    throw new ApiRequestError({
      message: userMessage,
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

  // Automatically attach auth token if available
  const session = getSession()
  if (session?.token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${session.token}`)
  }

  // Also support x-user-id for backend compatibility
  if (session?.user?.id && !headers.has('x-user-id')) {
    headers.set('x-user-id', session.user.id)
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
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'DELETE',
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
}
