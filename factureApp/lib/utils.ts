import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Une erreur est survenue.'
): string {
  if (typeof error === 'object' && error !== null) {
    const maybeError = error as {
      response?: { data?: { message?: string } }
      message?: string
    }

    return maybeError.response?.data?.message || maybeError.message || fallback
  }

  return fallback
}
