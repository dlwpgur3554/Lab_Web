import { useState } from 'react'
import { api } from '../lib/api'

export function LoginPage() {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const id = (loginId || '').trim()
      const pw = password || ''
      const { data } = await api.post('/auth/login', { loginId: id, password: pw })
      // JWT 토큰 저장
      if (data.token) {
        localStorage.setItem('lab_token', data.token)
        localStorage.setItem('lab_user', data.loginId || id)
      } else {
        // 하위 호환성: 기존 방식
        localStorage.setItem('lab_user', data.loginId || id)
      }
      // 커스텀 이벤트 발생하여 App 컴포넌트에 로그인 상태 변경 알림
      window.dispatchEvent(new Event('lab-auth-change'))
      window.location.href = '/'
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Invalid ID or password'
      setError(msg)
    }
  }

  return (
    <div className="container" style={{ padding: 20, display:'grid', placeItems:'center', minHeight:'60vh' }}>
      <form onSubmit={onSubmit} className="card" style={{ padding: 24, display:'grid', gap:12, width:'100%', maxWidth:420 }}>
        <h1 style={{ fontSize: '1.6rem', margin: 0 }}>Login</h1>
        <label>
          <div style={{ marginBottom: 6 }}>Login ID</div>
          <input value={loginId} onChange={e=>setLoginId(e.target.value)} placeholder="your_id" style={{ width:'100%', padding:'10px 12px', border:'1px solid #ddd', borderRadius:8 }} />
        </label>
        <label>
          <div style={{ marginBottom: 6 }}>Password</div>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••" style={{ width:'100%', padding:'10px 12px', border:'1px solid #ddd', borderRadius:8 }} />
        </label>
        {error && <div style={{ color:'#c00', fontSize:13 }}>{error}</div>}
        <button type="submit" style={{ padding:'10px 14px', borderRadius:8, background:'#3a4978', color:'#fff', border:'none', fontWeight:800, cursor:'pointer' }}>Sign In</button>
      </form>
    </div>
  )
}


