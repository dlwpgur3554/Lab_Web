import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, withUser } from '../lib/api'

type Member = {
  id: number
  name: string
  loginId: string
  role: 'NONE' | 'PROFESSOR' | 'LAB_LEAD' | 'MEMBER' | 'ALUMNI'
  email?: string
  phone?: string
  studentId?: string
  degree?: string
  photoUrl?: string
  admin?: boolean
  graduationYear?: number
}

export function MemberManagePage() {
  const navigate = useNavigate()
  const [members, setMembers] = useState<Member[]>([])
  const [ordering, setOrdering] = useState<Member[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [msg, setMsg] = useState('')
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  const [currentUserAdmin, setCurrentUserAdmin] = useState<boolean>(false)

  // 편집 중인 멤버 정보
  const [editName, setEditName] = useState('')
  const [editDegree, setEditDegree] = useState('')
  const [editRole, setEditRole] = useState<'NONE' | 'MEMBER' | 'ALUMNI' | 'PROFESSOR'>('MEMBER')
  const [editOriginalRole, setEditOriginalRole] = useState<'NONE' | 'MEMBER' | 'ALUMNI' | 'PROFESSOR'>('MEMBER')
  const [editPassword, setEditPassword] = useState('')
  const [editAdmin, setEditAdmin] = useState(false)
  const [editGraduationYear, setEditGraduationYear] = useState<string>('')

  // 새 멤버 추가 폼
  const [newName, setNewName] = useState('')
  const [newLoginId, setNewLoginId] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newDegree, setNewDegree] = useState('')
  const [newRole, setNewRole] = useState<'NONE' | 'MEMBER' | 'ALUMNI' | 'PROFESSOR'>('MEMBER')
  const [newAdmin, setNewAdmin] = useState(false)

  useEffect(() => {
    // 현재 사용자 권한 확인
    const me = localStorage.getItem('lab_user')
    if (!me) {
      navigate('/login')
      return
    }
    api.get<any>('/members/me', { headers: withUser() })
      .then(({ data }) => { setCurrentUserRole(data.role); setCurrentUserAdmin(!!data.admin) })
      .catch(() => navigate('/login'))
    
    loadMembers()
  }, [])

  const loadMembers = async () => {
    try {
      const { data } = await api.get<Member[]>('/members')
      // Current 멤버만 필터링 (Alumni 제외)
      const currentMembers = data.filter(m => m.role !== 'ALUMNI')
      setMembers(currentMembers)
      setOrdering(currentMembers)
    } catch (error: any) {
      setMsg(error?.response?.data?.message || '멤버 목록 로딩 실패')
    }
  }

  const isAdmin = () => currentUserAdmin === true

  if (!isAdmin()) {
    return <div className="container"><div className="section">권한이 없습니다.</div></div>
  }

  const startEdit = (member: Member) => {
    setEditingId(member.id)
    setEditName(member.name)
    setEditDegree(member.degree || '')
    const role = (member.role === 'NONE' || member.role === 'MEMBER' || member.role === 'ALUMNI' || member.role === 'PROFESSOR') ? member.role as any : 'MEMBER'
    setEditRole(role)
    setEditOriginalRole(role)
    setEditPassword('')
    setEditGraduationYear(member.graduationYear ? String(member.graduationYear) : '')
    // 서버 응답에 admin 불리언이 포함됨
    // @ts-ignore
    setEditAdmin(!!(member as any).admin)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditDegree('')
    setEditRole('MEMBER')
    setEditPassword('')
    setEditAdmin(false)
    setEditGraduationYear('')
  }

  const saveEdit = async (id: number) => {
    try {
      const payload: any = {
        name: editName,
        degree: editDegree || null,
        admin: editAdmin,
        email: null,
        phone: null,
        graduationYear: editGraduationYear ? parseInt(editGraduationYear) : null
      }
      if (editRole !== editOriginalRole) {
        payload.role = editRole
      }
      if (editPassword && editPassword.trim()) {
        payload.password = editPassword
      }
      await api.put(`/members/admin/${id}`, payload, { headers: withUser() })
      setEditingId(null)
      setMsg('저장되었습니다.')
      
      // 역할이 Alumni로 변경되면 Alumni 관리 페이지로 이동
      if (editRole === 'ALUMNI' && editRole !== editOriginalRole) {
        navigate('/members/manage/alumni')
        return
      }
      
      loadMembers()
    } catch (error: any) {
      console.error('저장 실패:', error)
      setMsg(error?.response?.data?.message || error?.message || '저장 실패')
    }
  }

  const changePassword = async (id: number, newPassword: string) => {
    try {
      await api.put(`/members/admin/${id}/password`, { newPassword }, { headers: withUser() })
      setMsg('비밀번호가 변경되었습니다.')
      cancelEdit()
    } catch (error: any) {
      setMsg(error?.response?.data?.message || '비밀번호 변경 실패')
    }
  }

  const deleteMember = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      await api.delete(`/members/admin/${id}`, { headers: withUser() })
      setMsg('삭제되었습니다.')
      loadMembers()
    } catch (error: any) {
      setMsg(error?.response?.data?.message || '삭제 실패')
    }
  }

  // 순서 변경 기능
  const moveUp = (idx: number) => {
    if (idx <= 0) return
    const next = ordering.slice()
    ;[next[idx-1], next[idx]] = [next[idx], next[idx-1]]
    setOrdering(next)
  }
  const moveDown = (idx: number) => {
    if (idx >= ordering.length - 1) return
    const next = ordering.slice()
    ;[next[idx], next[idx+1]] = [next[idx+1], next[idx]]
    setOrdering(next)
  }
  const saveOrder = async () => {
    try {
      await api.put('/members/admin/order', ordering.map(m => m.id), { headers: withUser() })
      setMsg('순서가 저장되었습니다.')
      await loadMembers()
    } catch (e: any) {
      setMsg(e?.response?.data?.message || '순서 저장 실패')
    }
  }

  const addMember = async () => {
    try {
      await api.post('/members/admin', {
        name: newName,
        loginId: newLoginId,
        password: newPassword,
        role: newRole,
        admin: newAdmin,
        email: null,
        phone: null,
        degree: newDegree,
        studentId: null,
        graduationYear: null
      }, { headers: withUser() })
      setShowAddForm(false)
      setNewName('')
      setNewLoginId('')
      setNewPassword('')
      setNewDegree('')
      setNewRole('MEMBER')
      setNewAdmin(false)
      setMsg('멤버가 추가되었습니다.')
      loadMembers()
    } catch (error: any) {
      setMsg(error?.response?.data?.message || '멤버 추가 실패')
    }
  }

  return (
    <div className="container">
      <div className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="card-title" style={{ fontSize: '2rem', marginBottom: 0 }}>Current 관리</h1>
          <div style={{ display:'flex', gap:8 }}>
            <Link to="/members/manage/alumni" className="btn-secondary">Alumni 관리</Link>
            <button onClick={saveOrder} className="btn-primary">순서 저장</button>
            <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary">멤버 추가</button>
          </div>
        </div>
      </div>

      {msg && (
        <div className="section">
          <div className="card" style={{ padding: 16, color: msg.includes('실패') || msg.includes('없습니다') ? '#c00' : '#28a745' }}>
            {msg}
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="section">
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>새 멤버 추가</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label className="input-label">이름</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="input-label">아이디</label>
                <input value={newLoginId} onChange={(e) => setNewLoginId(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="input-label">비밀번호</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="input-label">학위</label>
                <select value={newDegree} onChange={(e) => setNewDegree(e.target.value)} className="input-field">
                  <option value="">선택하세요</option>
                  <option value="학사">학사</option>
                  <option value="석사">석사</option>
                  <option value="박사">박사</option>
                </select>
              </div>
              <div>
                <label className="input-label">역할</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value as any)} className="input-field">
                  <option value="NONE">-</option>
                  <option value="MEMBER">Current</option>
                  <option value="PROFESSOR">Professor</option>
                </select>
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  Alumni는 <Link to="/members/manage/alumni" style={{ color: '#3a4978' }}>Alumni 관리 페이지</Link>에서 추가하세요.
                </div>
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={newAdmin} onChange={(e) => setNewAdmin(e.target.checked)} />
                  관리자 권한
                </label>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={addMember} className="btn-primary">추가</button>
                <button onClick={() => setShowAddForm(false)} className="btn-secondary">취소</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="section">
        <div className="card" style={{ padding: 24 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ padding: 12, textAlign: 'center' }}>이름</th>
                <th style={{ padding: 12, textAlign: 'center' }}>아이디</th>
                <th style={{ padding: 12, textAlign: 'center' }}>학위</th>
                <th style={{ padding: 12, textAlign: 'center' }}>역할</th>
                <th style={{ padding: 12, textAlign: 'center' }}>권한</th>
                <th style={{ padding: 12, textAlign: 'center' }}>작업</th>
                <th style={{ padding: 12, textAlign: 'center' }}>순서</th>
              </tr>
            </thead>
            <tbody>
              {ordering.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#999' }}>
                    등록된 Current 멤버가 없습니다.
                  </td>
                </tr>
              ) : (
                ordering.map((member, i) => (
                <tr key={member.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 12, textAlign:'center' }}>{editingId === member.id ? 
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} className="input-field" style={{ width: '100%' }} /> : member.name}
                  </td>
                  <td style={{ padding: 12, textAlign:'center' }}>{member.loginId}</td>
                  <td style={{ padding: 12, textAlign:'center' }}>{editingId === member.id ?
                    <input value={editDegree} onChange={(e) => setEditDegree(e.target.value)} className="input-field" style={{ width: '100%' }} /> : (member.degree || '-')}
                  </td>
                  <td style={{ padding: 12, textAlign:'center' }}>{editingId === member.id ?
                    <select value={editRole} onChange={(e) => setEditRole(e.target.value as any)} className="input-field" style={{ marginBottom: 8 }}>
                      <option value="NONE">-</option>
                      <option value="MEMBER">Current</option>
                      <option value="ALUMNI">Alumni</option>
                      <option value="PROFESSOR">Professor</option>
                    </select> :
                    (member.role === 'ALUMNI' ? 'Alumni' : member.role === 'PROFESSOR' ? 'Professor' : member.role === 'NONE' ? '-' : 'Current')}
                  </td>
                  <td style={{ padding: 12, textAlign:'center' }}>{editingId === member.id && editRole === 'ALUMNI' ? (
                    <input 
                      type="number" 
                      value={editGraduationYear} 
                      onChange={(e) => setEditGraduationYear(e.target.value)} 
                      className="input-field" 
                      style={{ width: '100%' }}
                      placeholder="졸업년도"
                      min="2000"
                      max="2100"
                    />
                  ) : '-'}</td>
                  <td style={{ padding: 12, textAlign:'center' }}>{editingId === member.id ?
                    <input type="checkbox" checked={editAdmin} onChange={(e) => setEditAdmin(e.target.checked)} disabled={(members.filter((m: any) => m.admin).length === 1) && (member as any).admin === true} /> :
                    ((member as any).admin ? '관리자' : '-')}
                  </td>
                  <td style={{ padding: 12, textAlign:'center', verticalAlign:'middle' }}>
                    {editingId === member.id ? (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent:'center' }}>
                        <button onClick={() => saveEdit(member.id)} className="btn-primary" style={{ fontSize: 14, padding: '6px 12px' }}>저장</button>
                        <button onClick={() => {
                          const pwd = prompt('새 비밀번호를 입력하세요:')
                          if (pwd) changePassword(member.id, pwd)
                        }} className="btn-secondary" style={{ fontSize: 14, padding: '6px 12px' }}>비밀번호 변경</button>
                        <button onClick={cancelEdit} className="btn-secondary" style={{ fontSize: 14, padding: '6px 12px' }}>취소</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent:'center' }}>
                        <button onClick={() => startEdit(member)} className="btn-secondary" style={{ fontSize: 14, padding: '6px 12px' }}>수정</button>
                        <button onClick={() => deleteMember(member.id)} className="btn-danger" style={{ fontSize: 14, padding: '6px 12px' }} disabled={(member as any).admin === true}>삭제</button>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: 12, textAlign: 'center', whiteSpace:'nowrap' }}>
                    <button onClick={() => moveUp(i)} className="btn-secondary" style={{ marginRight:6 }}>▲</button>
                    <button onClick={() => moveDown(i)} className="btn-secondary">▼</button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

