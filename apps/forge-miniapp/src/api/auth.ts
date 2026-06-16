import { request } from './request'

export const authApi = {
  wxLogin: (code: string) =>
    request<{ accessToken: string; refreshToken: string; userInfo: any }>({
      url: '/auth/wx-login',
      method: 'POST',
      data: { code }
    }),

  logout: () =>
    request<void>({
      url: '/auth/logout',
      method: 'POST'
    })
}