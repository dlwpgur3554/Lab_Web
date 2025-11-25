import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
})

// 공통 API 클라이언트. 헤더 X-USER를 임시로 사용합니다.
export function withUser(headers?: Record<string, string>) {
  const me = localStorage.getItem('lab_user')
  return me ? { ...headers, 'X-USER': me } : { ...headers }
}

