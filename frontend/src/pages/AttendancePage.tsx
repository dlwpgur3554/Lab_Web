import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, withUser } from '../lib/api'

type Attendance = {
  id: number
  workDate: string
  checkInAt?: string
  checkOutAt?: string
}

export function AttendancePage() {
  const [last, setLast] = useState<Attendance | null>(null)
  const [message, setMessage] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const me = localStorage.getItem('lab_user')
    if (!me) { setIsAdmin(false); return }
    api.get<any>('/members/me', { headers: withUser() })
      .then(({ data }) => setIsAdmin(!!data.admin))
      .catch(() => setIsAdmin(false))
  }, [])

  const checkIn = async () => {
    const { data } = await api.post<Attendance>('/attendance/check-in', {}, { headers: withUser() })
    setLast(data)
    setMessage('출근처리 되었습니다.')
  }
  const checkOut = async () => {
    try {
      const { data } = await api.post<Attendance>('/attendance/check-out', {}, { headers: withUser() })
      setLast(data)
      setMessage('퇴근처리 되었습니다.')
    } catch (e: any) {
      setMessage(e?.response?.data?.message || '퇴근 처리 실패')
    }
  }

  return (
    <div>
      <div className="section">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h1 className="card-title" style={{ fontSize: '2rem', marginBottom: 0 }}>출퇴근 관리</h1>
          {isAdmin && (
            <Link to="/attendance/stats" className="btn-secondary">통계 확인</Link>
          )}
        </div>
      </div>

      {/* 출퇴근 버튼 */}
      <div className="section">
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 20 }}>
            <button 
              onClick={checkIn}
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                padding: '16px 32px',
                borderRadius: 8,
                fontSize: '1.1rem',
                cursor: 'pointer',
                fontWeight: 700,
                transition: 'all 0.2s ease',
                minWidth: 140
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#218838'}
              onMouseOut={(e) => e.currentTarget.style.background = '#28a745'}
            >
              출근 체크
            </button>
            <button 
              onClick={checkOut}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '16px 32px',
                borderRadius: 8,
                fontSize: '1.1rem',
                cursor: 'pointer',
                fontWeight: 700,
                transition: 'all 0.2s ease',
                minWidth: 140
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#c82333'}
              onMouseOut={(e) => e.currentTarget.style.background = '#dc3545'}
            >
              퇴근 체크
            </button>
          </div>
          
          {message && (
            <div style={{ 
              padding: 16,
              borderRadius: 6,
              background: message.includes('실패') ? '#f8d7da' : '#d4edda',
              color: message.includes('실패') ? '#721c24' : '#155724',
              fontSize: '1rem',
              fontWeight: 700
            }}>
              {message}
            </div>
          )}
        </div>
      </div>

      {/* 최근 출퇴근 기록 */}
      {last && (
        <div className="section">
          <div className="card" style={{ padding: 24 }}>
            <h2 className="card-title" style={{ marginBottom: 16 }}>최근 출퇴근 기록</h2>
            <div className="grid" style={{ gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div className="card" style={{ 
                padding: 16,
                textAlign: 'center',
                background: 'var(--color-bg)'
              }}>
                <div className="card-meta" style={{ marginBottom: 6 }}>근무 날짜</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  {last.workDate}
                </div>
              </div>
              <div className="card" style={{ 
                padding: 16,
                textAlign: 'center',
                background: 'var(--color-bg)'
              }}>
                <div className="card-meta" style={{ marginBottom: 6 }}>출근 시간</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#28a745' }}>
                  {last.checkInAt ? new Date(last.checkInAt).toLocaleString() : '미출근'}
                </div>
              </div>
              <div className="card" style={{ 
                padding: 16,
                textAlign: 'center',
                background: 'var(--color-bg)'
              }}>
                <div className="card-meta" style={{ marginBottom: 6 }}>퇴근 시간</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#dc3545' }}>
                  {last.checkOutAt ? new Date(last.checkOutAt).toLocaleString() : '미퇴근'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 안내 메시지 */}
      <div className="section">
        <div className="card" style={{ 
          padding: 20,
          background: '#e3f2fd',
          border: '1px solid #bbdefb'
        }}>
          <h3 className="card-title" style={{ marginBottom: 10, color: '#1976d2' }}>출퇴근 안내</h3>
          <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--color-text)', lineHeight: 1.6 }}>
            <li>출근 시 "출근 체크" 버튼을 눌러주세요.</li>
            <li>퇴근 시 "퇴근 체크" 버튼을 눌러주세요.</li>
            <li>출근하지 않은 상태에서 퇴근 체크는 불가능합니다.</li>
            <li>출퇴근 기록은 자동으로 저장됩니다.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// 출퇴근 체크 화면입니다. 마지막 처리 결과를 간단히 보여줍니다.

