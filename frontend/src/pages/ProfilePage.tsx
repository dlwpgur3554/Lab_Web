import { FormEvent, useEffect, useState } from 'react'
import { api, withUser } from '../lib/api'

type Member = {
  id: number
  name: string
  email?: string
  phone?: string
  degree?: string
  photoUrl?: string
}

export function ProfilePage() {
  const [me, setMe] = useState<Member | null>(null)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [degree, setDegree] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [newPw2, setNewPw2] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get<Member>('/members/me', { headers: withUser() })
      setMe(data)
      setEmail(data.email || '')
      setPhone(data.phone || '')
      setDegree(data.degree || '')
      setPhotoUrl(data.photoUrl || '')
    }
    load()
  }, [])

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault()
    await api.put('/members/me', { email, phone, degree, photoUrl }, { headers: withUser() })
    setMsg('프로필이 저장되었습니다.')
  }

  const uploadPhoto = async (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    const { data } = await api.post<{ url: string }>('/upload', fd, { headers: { ...withUser(), 'Content-Type': 'multipart/form-data' } })
    setPhotoUrl(data.url)
  }

  const changePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (newPw !== newPw2) { setMsg('비밀번호 확인이 일치하지 않습니다.'); return }
    await api.put('/members/me/password', { oldPassword: oldPw, newPassword: newPw }, { headers: withUser() })
    setMsg('비밀번호가 변경되었습니다.')
    setOldPw(''); setNewPw(''); setNewPw2('')
  }

  const inputStyle: React.CSSProperties = { width:'100%', padding:'12px 14px', border:'1px solid var(--border-color)', borderRadius:10, fontSize:'1rem', outline:'none', background:'#fff' }
  const labelStyle: React.CSSProperties = { display:'block', marginBottom:6, fontWeight:800, color:'#444' }

  return (
    <div className="container">
      <div className="section">
        <h1 className="card-title" style={{ fontSize: '2rem', marginBottom: 0 }}>프로필</h1>
      </div>

      <div className="section" style={{ display:'grid', gap:16, gridTemplateColumns: '320px 1fr' }}>
        {/* 좌측: 프로필 카드 */}
        <div className="card" style={{ padding:24, display:'grid', justifyItems:'center', alignContent:'start', gap:16 }}>
          <div style={{ width:140, height:140, borderRadius:'50%', overflow:'hidden', border:'1px solid var(--border-color)', boxShadow:'var(--shadow-sm)', background:'#f5f5f5' }}>
            {photoUrl ? (
              <img src={photoUrl} alt="profile" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            ) : (
              <div style={{ width:'100%', height:'100%', display:'grid', placeItems:'center', color:'#888' }}>No Image</div>
            )}
          </div>
          <label style={labelStyle}>사진 업로드</label>
          <input type="file" accept="image/*" onChange={(e)=> { const f = e.target.files?.[0]; if (f) uploadPhoto(f) }} />
          {me && (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontWeight:900, fontSize:'1.1rem' }}>{me.name}</div>
              {me.email && <div style={{ color:'var(--color-muted)', fontSize:'.95rem' }}>{me.email}</div>}
            </div>
          )}
        </div>

        {/* 우측: 정보/비밀번호 폼 */}
        <div style={{ display:'grid', gap:16 }}>
          <form onSubmit={saveProfile} className="card" style={{ padding:24, display:'grid', gap:14 }}>
            <h2 className="card-title" style={{ margin:0 }}>정보 수정</h2>
            <div>
              <label style={labelStyle}>학위</label>
              <select value={degree} onChange={(e)=> setDegree(e.target.value)} style={{ ...inputStyle, padding:'12px 10px' }}>
                <option value="">선택</option>
                <option value="학사">학사</option>
                <option value="석사">석사</option>
                <option value="박사">박사</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>이메일</label>
              <input value={email} onChange={(e)=> setEmail(e.target.value)} style={inputStyle} type="email" placeholder="name@example.com" />
            </div>
            <div>
              <label style={labelStyle}>전화번호</label>
              <input value={phone} onChange={(e)=> setPhone(e.target.value)} style={inputStyle} placeholder="010-0000-0000" />
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <button type="submit" style={{ padding:'10px 16px', borderRadius:8, background:'#3a4978', color:'#fff', border:'none', fontWeight:800, cursor:'pointer' }}>저장</button>
            </div>
          </form>

          <form onSubmit={changePassword} className="card" style={{ padding:24, display:'grid', gap:14 }}>
            <h2 className="card-title" style={{ margin:0 }}>비밀번호 변경</h2>
            <div>
              <label style={labelStyle}>기존 비밀번호</label>
              <input type="password" value={oldPw} onChange={(e)=> setOldPw(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>변경할 비밀번호</label>
              <input type="password" value={newPw} onChange={(e)=> setNewPw(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>비밀번호 확인</label>
              <input type="password" value={newPw2} onChange={(e)=> setNewPw2(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button type="submit" style={{ padding:'10px 16px', borderRadius:8, background:'var(--color-primary)', color:'#fff', border:'none', fontWeight:800, cursor:'pointer' }}>변경</button>
            </div>
          </form>
        </div>
      </div>

      {msg && (
        <div className="section"><div className="card" style={{ padding:16 }}>{msg}</div></div>
      )}
    </div>
  )
}


