import { useEffect, useState } from 'react'
import { api, withUser } from '../lib/api'

type Item = { id:number; title:string; content:string; createdAt:string; pinned?: boolean; author:{ id:number; name:string; loginId?:string } }

export function NoticeDetailPage() {
  const id = window.location.pathname.split('/').pop()
  const [item, setItem] = useState<Item | null>(null)
  const [msg, setMsg] = useState('')
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const togglePin = async () => {
    if (!item) return
    try {
      await api.put(`/notices/${item.id}/pin`, null, { params: { pinned: !(item.pinned ?? false) }, headers: withUser() })
      await load()
    } catch (e: any) {
      setMsg(e?.response?.data?.message || '변경 실패')
    }
  }

  const load = async () => {
    const { data } = await api.get<Item>(`/notices/${id}`)
    setItem(data)
    setTitle(data.title)
    setContent(data.content)
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    const me = localStorage.getItem('lab_user')
    if (!me) return
    api.get<any>(`/members/me`, { headers: withUser() })
      .then(({ data }) => setIsAdmin(!!data.admin))
      .catch(() => setIsAdmin(false))
  }, [])

  const isOwner = () => {
    const me = localStorage.getItem('lab_user') || ''
    // 간단 판정: 작성자의 loginId 또는 name이 lab_user와 일치하면 소유자
    return !!(item && (item.author?.loginId === me || item.author?.name === me))
  }
  const canEdit = () => isAdmin || isOwner()

  const onDelete = async () => {
    try {
      await api.delete(`/notices/${id}`, { headers: withUser() })
      window.location.href = '/notices'
    } catch (e: any) {
      setMsg(e?.response?.data?.message || '삭제 실패')
    }
  }

  const onSave = async () => {
    try {
      await api.put(`/notices/${id}`, { title, content }, { headers: withUser() })
      setEditing(false)
      await load()
      setMsg('저장되었습니다.')
    } catch (e: any) {
      setMsg(e?.response?.data?.message || '저장 실패')
    }
  }

  if (!item) return <div className="container"><div className="section">Loading...</div></div>

  return (
    <div className="container">
      <div className="section" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h1 className="card-title" style={{ fontSize:'2rem', margin:0 }}>{editing ? '수정' : item.title}</h1>
        {canEdit() && (
          <div style={{ display:'flex', gap:8 }}>
            {!editing && (
              <button onClick={togglePin} style={{ padding:'10px 16px', borderRadius:8, background:'#6f42c1', color:'#fff', border:'none', fontWeight:800, cursor:'pointer' }}>{item?.pinned ? '고정 해제' : '상단 고정'}</button>
            )}
            {editing ? (
              <>
          <button onClick={onSave} style={{ padding:'10px 16px', borderRadius:8, background:'#3a4978', color:'#fff', border:'none', fontWeight:800, cursor:'pointer' }}>저장</button>
                <button onClick={()=> { setEditing(false); setTitle(item.title); setContent(item.content) }} style={{ padding:'10px 16px', borderRadius:8, background:'#6c757d', color:'#fff', border:'none', fontWeight:800, cursor:'pointer' }}>취소</button>
              </>
            ) : (
              <>
                <button onClick={()=> setEditing(true)} style={{ padding:'10px 16px', borderRadius:8, background:'var(--color-primary)', color:'#fff', border:'none', fontWeight:800, cursor:'pointer' }}>수정</button>
                <button onClick={onDelete} style={{ padding:'10px 16px', borderRadius:8, background:'#dc3545', color:'#fff', border:'none', fontWeight:800, cursor:'pointer' }}>삭제</button>
              </>
            )}
          </div>
        )}
      </div>
      <div className="section">
        <div className="card" style={{ padding:24 }}>
          <div className="card-meta" style={{ marginBottom:12 }}>{new Date(item.createdAt).toLocaleString()} · 작성자: {item.author?.name}</div>
          {editing ? (
            <div style={{ display:'grid', gap:12 }}>
              <input value={title} onChange={(e)=> setTitle(e.target.value)} style={{ width:'100%', padding:'12px 14px', border:'1px solid var(--border-color)', borderRadius:10 }} />
              <textarea value={content} onChange={(e)=> setContent(e.target.value)} rows={14} style={{ width:'100%', padding:'12px 14px', border:'1px solid var(--border-color)', borderRadius:10, fontFamily:'inherit' }} />
            </div>
          ) : (
            <div style={{ whiteSpace:'pre-wrap', lineHeight:1.7 }}>{item.content}</div>
          )}
        </div>
        {msg && <div className="card" style={{ padding:16, marginTop:12 }}>{msg}</div>}
      </div>
    </div>
  )
}


