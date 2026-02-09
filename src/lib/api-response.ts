import { NextResponse } from 'next/server'

export type ApiSuccess<T> = {
  success: true
  data: T
}

export type ApiError = {
  success: false
  error: string
  details?: unknown
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export function jsonSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>({ success: true, data }, init)
}

export function jsonError(
  error: string,
  status: number = 500,
  details?: unknown,
  init?: ResponseInit
) {
  return NextResponse.json<ApiError>(
    { success: false, error, ...(details !== undefined ? { details } : {}) },
    { status, ...init }
  )
}
