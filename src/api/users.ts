import { apiClient } from './client'
import { USE_MOCKS } from '../lib/mockConfig'
import { mockUsers } from './mockStore'
import type { Currency, Theme, User } from '../types/domain'

export interface UpdateProfilePayload {
  name: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface UpdatePreferencesPayload {
  theme: Theme
  defaultCurrency: Currency
  emailNotificationsEnabled: boolean
}

export const usersApi = {
  async me(): Promise<User> {
    if (USE_MOCKS) return mockUsers.me()
    const { data } = await apiClient.get<User>('/users/me')
    return data
  },
  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    if (USE_MOCKS) return mockUsers.updateProfile(payload.name)
    const { data } = await apiClient.patch<User>('/users/me', payload)
    return data
  },
  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    if (USE_MOCKS) return mockUsers.changePassword()
    await apiClient.patch('/users/me/password', payload)
  },
  async deleteAccount(): Promise<void> {
    if (USE_MOCKS) return mockUsers.deleteAccount()
    await apiClient.delete('/users/me')
  },
  async logoutAllDevices(): Promise<void> {
    if (USE_MOCKS) return mockUsers.logoutAllDevices()
    await apiClient.post('/users/me/logout-all')
  },
  async updatePreferences(payload: UpdatePreferencesPayload): Promise<User> {
    if (USE_MOCKS) return mockUsers.updatePreferences(payload)
    const { data } = await apiClient.patch<User>('/users/me/preferences', payload)
    return data
  },
  async uploadAvatar(file: File): Promise<User> {
    if (USE_MOCKS) return mockUsers.uploadAvatar(file)
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await apiClient.post<User>('/users/me/avatar', formData)
    return data
  },
  async deleteAvatar(): Promise<void> {
    if (USE_MOCKS) return mockUsers.deleteAvatar()
    await apiClient.delete('/users/me/avatar')
  },
}
