import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
})

// 요청 인터셉터: JWT 토큰 추가 (보안 강화: JWT 토큰 필수)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lab_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // JWT 토큰이 없으면 인증 실패 (보안 강화)
    // X-USER 헤더는 하위 호환성을 위해 AuthService에서만 사용
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터: 401 에러 시 로그아웃
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('lab_token')
      localStorage.removeItem('lab_user')
      // 커스텀 이벤트 발생하여 App 컴포넌트에 로그인 상태 변경 알림
      window.dispatchEvent(new Event('lab-auth-change'))
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// 공통 API 클라이언트. JWT 토큰 사용 (보안 강화)
export function withUser(headers?: Record<string, string>) {
  const token = localStorage.getItem('lab_token')
  if (token) {
    return { ...headers, Authorization: `Bearer ${token}` }
  }
  // JWT 토큰이 없으면 빈 헤더 반환 (인증 실패)
  return { ...headers }
}

