import { apiClient } from './client'
import { USE_MOCKS } from '../lib/mockConfig'
import { mockAuth } from './mockStore'
import type { AuthTokens, User } from '../types/domain'

export interface SignupPayload {
  name: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export const authApi = {
  async signup(payload: SignupPayload): Promise<User> {
    if (USE_MOCKS) return mockAuth.signup(payload.name, payload.email)
    const { data } = await apiClient.post<User>('/auth/signup', payload)
    return data
  },
  async login(payload: LoginPayload): Promise<AuthTokens> {
    if (USE_MOCKS) return mockAuth.login()
    const { data } = await apiClient.post<AuthTokens>('/auth/login', payload)
    return data
  },
  async logout(refreshToken: string): Promise<void> {
    if (USE_MOCKS) return mockAuth.logout()
    await apiClient.post('/auth/logout', { refreshToken })
  },
}
