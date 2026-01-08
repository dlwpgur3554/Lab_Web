import { useEffect, useMemo, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { api, withUser } from '../lib/api'

type Member = {
  id: number
  name: string
  role: string
  admin?: boolean
  email?: string
  phone?: string
  studentId?: string
  researchArea?: string
  bio?: string
  photoUrl?: string
  degree?: string
  graduationYear?: number
}

export function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const location = useLocation()

  const type = new URLSearchParams(location.search).get('type') || 'all'

  useEffect(() => {
    const checkAdmin = async () => {
      const me = localStorage.getItem('lab_user')
      if (me) {
        try {
          const { data } = await api.get<any>('/members/me', { headers: withUser() })
          setIsAdmin(!!data.admin)
        } catch {
          setIsAdmin(false)
        }
      }
    }
    checkAdmin()
  }, [])

  const loadMembers = async () => {
    try {
      const { data } = await api.get<Member[]>('/members')
      setMembers(data)
    } catch (error) {
      console.error('멤버 로딩 실패:', error)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [])

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'NONE': return '#6c757d'
      case 'PROFESSOR': return '#dc3545'
      case 'LAB_LEAD': return '#fd7e14'
      case 'MEMBER': return '#28a745'
      default: return '#6c757d'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'NONE': return '-'
      case 'PROFESSOR': return '교수'
      case 'LAB_LEAD': return '연구실장'
      case 'MEMBER': return '연구원'
      default: return role
    }
  }

  const filteredMembers = useMemo(() => {
    const base = members.filter(m => m.role !== 'NONE') // '-' 처리 계정 숨김
    if (type === 'professor') return base.filter(m => m.role === 'PROFESSOR')
    if (type === 'current') return base.filter(m => m.role !== 'PROFESSOR' && m.role !== 'ALUMNI')
    if (type === 'alumni') return base.filter(m => m.role === 'ALUMNI')
    return base
  }, [members, type])

  const groupedMembers = {
    PROFESSOR: filteredMembers.filter(m => m.role === 'PROFESSOR'),
    NON_PROFESSOR: filteredMembers.filter(m => m.role !== 'PROFESSOR')
  }

  return (
    <div className="container">
      <div className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="card-title" style={{ fontSize: '2rem', marginBottom: 0 }}>Members</h1>
          {isAdmin && (
            <Link to="/members/manage" className="btn-primary">관리</Link>
          )}
        </div>
      </div>

      {/* 역할 필터 제거 */}

      {/* 교수진 */}
      {groupedMembers.PROFESSOR.length > 0 && type !== 'current' && type !== 'alumni' && (
        <div className="section">
          <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: 20, borderBottom: '2px solid #dc3545', paddingBottom: 10 }}>
            Professor
          </h2>
          <div className="grid" style={{ gap: 32, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', justifyItems: 'center' as any }}>
            {groupedMembers.PROFESSOR.map((member) => (
              <div key={member.id} style={{ padding: 8, textAlign: 'center' }}>
                <div style={{ width: 180, height: 180, margin: '0 auto 12px', borderRadius: '50%', overflow: 'hidden', background: '#fff', border: '1px solid #eee' }}>
                  {member.photoUrl && (
                    <img src={member.photoUrl} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }} />
                  )}
                </div>
                {member.email && <div style={{ color: '#666', fontSize: 14, marginBottom: 4 }}>{member.email}</div>}
                {member.degree && <div style={{ color: '#888', fontSize: 13, marginBottom: 10 }}>{member.degree}</div>}
                <div style={{ fontWeight: 800, fontSize: 16 }}>{member.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alumni 전용 섹션 - 년도별 그룹화 */}
      {type === 'alumni' && (() => {
        // 년도별로 그룹화 (졸업 년도가 없는 경우 "기타"로 분류)
        const groupedByYear = filteredMembers.reduce((acc, member) => {
          const year = member.graduationYear || 0; // 년도가 없으면 0으로 처리
          if (!acc[year]) {
            acc[year] = [];
          }
          acc[year].push(member);
          return acc;
        }, {} as Record<number, Member[]>);

        // 년도별로 정렬 (오름차순: 오래된 년도가 먼저, 기타는 맨 뒤)
        const sortedYears = Object.keys(groupedByYear)
          .map(Number)
          .sort((a, b) => {
            if (a === 0) return 1; // 기타는 맨 뒤
            if (b === 0) return -1;
            return a - b; // 오름차순
          });

        return (
          <div className="section">
            <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: 30, borderBottom: '2px solid #28a745', paddingBottom: 10 }}>
              Alumni
            </h2>
            {sortedYears.map((year) => (
              <div key={year} style={{ marginBottom: 40 }}>
                <h3 className="card-title" style={{ 
                  fontSize: '1.3rem', 
                  marginBottom: 20, 
                  color: '#222',
                  fontWeight: 700,
                  borderBottom: '1px solid #e0e0e0',
                  paddingBottom: 8
                }}>
                  {year === 0 ? '기타' : `${year}년 졸업`}
                </h3>
                <div className="grid" style={{ gap: 32, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', justifyItems: 'center' as any }}>
                  {groupedByYear[year].map((member) => (
                    <div key={member.id} style={{ padding: 8, textAlign: 'center' }}>
                      <div style={{ width: 180, height: 180, margin: '0 auto 12px', borderRadius: '50%', overflow: 'hidden', background: '#fff', border: '1px solid #eee' }}>
                        {member.photoUrl && (
                          <img src={member.photoUrl} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }} />
                        )}
                      </div>
                      {member.email && <div style={{ color: '#666', fontSize: 14, marginBottom: 4 }}>{member.email}</div>}
                      {member.degree && <div style={{ color: '#888', fontSize: 13, marginBottom: 10 }}>{member.degree}</div>}
                      <div style={{ fontWeight: 800, fontSize: 16 }}>{member.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* 교수 외 구성원 (Current) */}
      {type !== 'professor' && type !== 'alumni' && groupedMembers.NON_PROFESSOR.length > 0 && (
        <div className="section">
          <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: 20, borderBottom: '2px solid #28a745', paddingBottom: 10 }}>
            Current Members
          </h2>
          <div className="grid" style={{ gap: 32, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', justifyItems: 'center' as any }}>
            {groupedMembers.NON_PROFESSOR.map((member) => (
              <div key={member.id} style={{ padding: 8, textAlign: 'center' }}>
                <div style={{ width: 180, height: 180, margin: '0 auto 12px', borderRadius: '50%', overflow: 'hidden', background: '#fff', border: '1px solid #eee' }}>
                  {member.photoUrl && (
                    <img src={member.photoUrl} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }} />
                  )}
                </div>
                {member.degree && <div style={{ color: '#888', fontSize: 13, marginBottom: 10 }}>{member.degree}</div>}
                <div style={{ fontWeight: 800, fontSize: 16 }}>{member.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredMembers.length === 0 && (
        <div className="section">
          <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)' }}>
            등록된 인원이 없습니다.
          </div>
        </div>
      )}
    </div>
  )
}

