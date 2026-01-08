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

export function AlumniManagePage() {
  const navigate = useNavigate()
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [msg, setMsg] = useState('')
  const [currentUserAdmin, setCurrentUserAdmin] = useState<boolean>(false)
  const [sortByYear, setSortByYear] = useState<'asc' | 'desc'>('desc') // 내림차순 (최신년도 먼저)

  // 편집 중인 멤버 정보
  const [editName, setEditName] = useState('')
  const [editDegree, setEditDegree] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editGraduationYear, setEditGraduationYear] = useState<string>('')
  const [editRole, setEditRole] = useState<'ALUMNI' | 'MEMBER'>('ALUMNI')
  const [editOriginalRole, setEditOriginalRole] = useState<'ALUMNI' | 'MEMBER'>('ALUMNI')

  // 새 멤버 추가 폼
  const [newName, setNewName] = useState('')
  const [newLoginId, setNewLoginId] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newDegree, setNewDegree] = useState('')
  const [newGraduationYear, setNewGraduationYear] = useState<string>('')

  useEffect(() => {
    // 현재 사용자 권한 확인
    const me = localStorage.getItem('lab_user')
    if (!me) {
      navigate('/login')
      return
    }
    api.get<any>('/members/me', { headers: withUser() })
      .then(({ data }) => { setCurrentUserAdmin(!!data.admin) })
      .catch(() => navigate('/login'))
    
    loadMembers()
  }, [])

  useEffect(() => {
    // Alumni 멤버만 필터링 및 정렬
    const alumni = members.filter(m => m.role === 'ALUMNI')
    const sorted = [...alumni].sort((a, b) => {
      const yearA = a.graduationYear || 0
      const yearB = b.graduationYear || 0
      return sortByYear === 'desc' ? yearB - yearA : yearA - yearB
    })
    setFilteredMembers(sorted)
  }, [members, sortByYear])

  const loadMembers = async () => {
    try {
      const { data } = await api.get<Member[]>('/members')
      setMembers(data)
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
    setEditPassword('')
    setEditGraduationYear(member.graduationYear ? String(member.graduationYear) : '')
    const role = member.role === 'ALUMNI' ? 'ALUMNI' : 'MEMBER'
    setEditRole(role)
    setEditOriginalRole(role)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditDegree('')
    setEditPassword('')
    setEditGraduationYear('')
    setEditRole('ALUMNI')
    setEditOriginalRole('ALUMNI')
  }

  const saveEdit = async (id: number) => {
    try {
      const payload: any = {
        name: editName,
        degree: editDegree || null,
        admin: false, // Alumni는 관리자 권한 없음
        email: null,
        phone: null,
        graduationYear: editGraduationYear ? parseInt(editGraduationYear) : null
      }
      if (editRole !== editOriginalRole) {
        payload.role = editRole
      } else {
        payload.role = 'ALUMNI' // 역할이 변경되지 않으면 ALUMNI 유지
      }
      if (editPassword && editPassword.trim()) {
        payload.password = editPassword
      }
      await api.put(`/members/admin/${id}`, payload, { headers: withUser() })
      setEditingId(null)
      setMsg('저장되었습니다.')
      
      // 역할이 Current(MEMBER)로 변경되면 Current 멤버 관리 페이지로 이동
      if (editRole === 'MEMBER' && editRole !== editOriginalRole) {
        navigate('/members/manage')
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

  const addMember = async () => {
    try {
      await api.post('/members/admin', {
        name: newName,
        loginId: newLoginId,
        password: newPassword,
        role: 'ALUMNI',
        admin: false,
        email: null,
        phone: null,
        degree: newDegree,
        studentId: null,
        graduationYear: newGraduationYear ? parseInt(newGraduationYear) : null
      }, { headers: withUser() })
      setShowAddForm(false)
      setNewName('')
      setNewLoginId('')
      setNewPassword('')
      setNewDegree('')
      setNewGraduationYear('')
      setMsg('Alumni 멤버가 추가되었습니다.')
      loadMembers()
    } catch (error: any) {
      setMsg(error?.response?.data?.message || '멤버 추가 실패')
    }
  }

  return (
    <div className="container">
      <div className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="card-title" style={{ fontSize: '2rem', marginBottom: 0 }}>Alumni 관리</h1>
          <div style={{ display:'flex', gap:8 }}>
            <Link to="/members/manage" className="btn-secondary">Current 멤버 관리</Link>
            <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary">Alumni 추가</button>
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
            <h2 style={{ marginTop: 0 }}>새 Alumni 추가</h2>
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
                <label className="input-label">졸업 년도 *</label>
                <input 
                  type="number" 
                  value={newGraduationYear} 
                  onChange={(e) => setNewGraduationYear(e.target.value)} 
                  className="input-field" 
                  placeholder="예: 2024"
                  min="2000"
                  max="2100"
                  required
                />
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>정렬:</span>
                <select value={sortByYear} onChange={(e) => setSortByYear(e.target.value as 'asc' | 'desc')} className="input-field" style={{ width: 'auto' }}>
                  <option value="desc">최신년도 먼저</option>
                  <option value="asc">오래된 년도 먼저</option>
                </select>
              </label>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ padding: 12, textAlign: 'center' }}>이름</th>
                <th style={{ padding: 12, textAlign: 'center' }}>아이디</th>
                <th style={{ padding: 12, textAlign: 'center' }}>학위</th>
                <th style={{ padding: 12, textAlign: 'center' }}>역할</th>
                <th style={{ padding: 12, textAlign: 'center' }}>졸업년도</th>
                <th style={{ padding: 12, textAlign: 'center' }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#999' }}>
                    등록된 Alumni가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: 12, textAlign:'center' }}>{editingId === member.id ? 
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} className="input-field" style={{ width: '100%' }} /> : member.name}
                    </td>
                    <td style={{ padding: 12, textAlign:'center' }}>{member.loginId}</td>
                    <td style={{ padding: 12, textAlign:'center' }}>{editingId === member.id ?
                      <input value={editDegree} onChange={(e) => setEditDegree(e.target.value)} className="input-field" style={{ width: '100%' }} /> : (member.degree || '-')}
                    </td>
                    <td style={{ padding: 12, textAlign:'center' }}>{editingId === member.id ?
                      <select value={editRole} onChange={(e) => setEditRole(e.target.value as 'ALUMNI' | 'MEMBER')} className="input-field" style={{ marginBottom: 8 }}>
                        <option value="ALUMNI">Alumni</option>
                        <option value="MEMBER">Current</option>
                      </select> :
                      'Alumni'}
                    </td>
                    <td style={{ padding: 12, textAlign:'center' }}>{editingId === member.id ?
                      <input 
                        type="number" 
                        value={editGraduationYear} 
                        onChange={(e) => setEditGraduationYear(e.target.value)} 
                        className="input-field" 
                        style={{ width: '100%' }}
                        placeholder="졸업년도"
                        min="2000"
                        max="2100"
                      /> :
                      (member.graduationYear ? `${member.graduationYear}년` : '-')}
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
                          <button onClick={() => deleteMember(member.id)} className="btn-danger" style={{ fontSize: 14, padding: '6px 12px' }}>삭제</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

