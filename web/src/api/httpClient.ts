import axios from 'axios'

import { getAccessToken } from '../admin/utils/token'

const baseURL =
  window.__APP_CONFIG__?.API_BASE_URL?.trim() ??
  import.meta.env.VITE_API_BASE_URL ??
  ''

export const httpClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

httpClient.interceptors.request.use((config) => {
  const token = getAccessToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})
