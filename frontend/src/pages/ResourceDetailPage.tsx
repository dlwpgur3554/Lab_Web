import { useEffect, useMemo, useState } from 'react'
import { api, withUser } from '../lib/api'

type Attachment = { id:number; url:string; name:string; contentType:string; sizeBytes:number; fileKey?: string }
type Item = { id:number; title:string; content:string; createdAt:string; category?:string; author?: { id:number; name:string; loginId?:string }; attachments?: Attachment[] }

export function ResourceDetailPage() {
  const id = window.location.pathname.split('/').pop()
  const [item, setItem] = useState<Item | null>(null)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [msg, setMsg] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [toDelete, setToDelete] = useState<Set<number>>(new Set())

  useEffect(() => {
    api.get<Item>(`/notices/${id}`).then(({ data }) => { setItem(data); setTitle(data.title); setContent(data.content) })
  }, [])
  useEffect(() => {
    const me = localStorage.getItem('lab_user')
    if (!me) return
    api.get<any>(`/members/me`, { headers: withUser() })
      .then(({ data }) => setIsAdmin(!!data.admin))
      .catch(() => setIsAdmin(false))
  }, [])

  const parsed = useMemo(() => {
    return { files: (item?.attachments || []).map(a=>a.url), text: (item?.content || '') }
  }, [item, content])

  const isOwner = () => {
    const me = localStorage.getItem('lab_user') || ''
    return !!(item && (item.author?.loginId === me || item.author?.name === me))
  }
  const canEdit = () => isAdmin || isOwner()

  const onDelete = async () => {
    try {
      await api.delete(`/notices/${id}`, { headers: withUser() })
      window.location.href = '/resources'
    } catch (e: any) { setMsg(e?.response?.data?.message || '삭제 실패') }
  }

  const onSave = async () => {
    try {
      const fd = new FormData()
      fd.append('title', title)
      fd.append('content', content)
      fd.append('category', item?.category || 'RESOURCE')
      newFiles.forEach(f => fd.append('files', f))
      if (toDelete.size > 0) Array.from(toDelete).forEach(id => fd.append('deleteAttachmentIds', String(id)))
      await api.post(`/notices/${id}/form`, fd, { headers: { ...withUser() } })
      setEditing(false)
      setNewFiles([])
      setToDelete(new Set())
      await api.get<Item>(`/notices/${id}`).then(({ data }) => { setItem(data); setTitle(data.title); setContent(data.content) })
      setMsg('저장되었습니다.')
    } catch (e: any) { setMsg(e?.response?.data?.message || '저장 실패') }
  }

  if (!item) return <div className="container"><div className="section">Loading...</div></div>

  const base = (api.defaults.baseURL || '').replace(/\/$/, '')
  return (
    <div className="container">
      <div className="section" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h1 className="card-title" style={{ fontSize:'2rem', margin:0 }}>{editing ? '수정' : item.title}</h1>
        {canEdit() && (
          <div style={{ display:'flex', gap:8 }}>
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
          <div className="card-meta" style={{ marginBottom:12 }}>{new Date(item.createdAt).toLocaleString()}</div>
          {editing ? (
            <div style={{ display:'grid', gap:12 }}>
              <input value={title} onChange={(e)=> setTitle(e.target.value)} style={{ width:'100%', padding:'12px 14px', border:'1px solid var(--border-color)', borderRadius:10 }} />
              <textarea value={content} onChange={(e)=> setContent(e.target.value)} rows={14} style={{ width:'100%', padding:'12px 14px', border:'1px solid var(--border-color)', borderRadius:10, fontFamily:'inherit' }} />
              {(item?.attachments?.length || 0) > 0 && (
                <div style={{ padding:16, backgroundColor:'#f8f9fa', borderRadius:8, border:'1px solid #e9ecef' }}>
                  <h4 style={{ margin:'0 0 12px 0', fontSize:'16px', fontWeight:'bold', color:'#495057' }}>기존 첨부파일</h4>
                  <ul style={{ margin:0, paddingLeft:18 }}>
                    {item?.attachments?.map(a => (
                      <li key={a.id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                        <span style={{ fontSize:'14px', color:'#6c757d' }}>📎</span>
                        <a
                          href={a.fileKey ? `${base}/notices/files/download?fileKey=${a.fileKey}` : `${base}/notices/attachments/${a.id}/download`}
                        >{a.name}</a>
                        <label style={{ fontSize:12, color:'#c00', cursor:'pointer', marginLeft:'auto' }}>
                          <input type="checkbox" onChange={(e) => {
                            const next = new Set(toDelete)
                            if (e.target.checked) next.add(a.id); else next.delete(a.id)
                            setToDelete(next)
                          }} /> 삭제
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <label className="input-label">첨부 추가</label>
                <input type="file" multiple onChange={(e)=> setNewFiles(Array.from(e.target.files || []))} />
                {newFiles.length>0 && <ul style={{ marginTop:8 }}>{newFiles.map((f,i)=>(<li key={i}>{f.name}</li>))}</ul>}
              </div>
            </div>
          ) : (
            <>
              <div style={{ whiteSpace:'pre-wrap', lineHeight:1.7 }}>{parsed.text}</div>
              {(item?.attachments?.length || 0) > 0 && (
                <div style={{ marginTop:16, padding:16, backgroundColor:'#f8f9fa', borderRadius:8, border:'1px solid #e9ecef' }}>
                  <h4 style={{ margin:'0 0 12px 0', fontSize:'16px', fontWeight:'bold', color:'#495057' }}>첨부파일</h4>
                  <ul style={{ margin:0, paddingLeft:18 }}>
                    {item?.attachments?.map(a => (
                      <li key={a.id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                        <span style={{ fontSize:'14px', color:'#6c757d' }}>📎</span>
                        <a
                          href={a.fileKey ? `${base}/notices/files/download?fileKey=${a.fileKey}` : `${base}/notices/attachments/${a.id}/download`}
                        >{a.name}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
        {msg && <div className="card" style={{ padding:16, marginTop:12 }}>{msg}</div>}
      </div>
    </div>
  )
}


