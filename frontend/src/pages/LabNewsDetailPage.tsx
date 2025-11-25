import { useEffect, useMemo, useState } from 'react'
import { api, withUser } from '../lib/api'

type Attachment = { id:number; url:string; name:string; contentType:string; sizeBytes:number }
type Item = { id:number; title:string; content:string; createdAt:string; category?:string; author?: { id:number; name:string; loginId?:string }; attachments?: Attachment[] }

export function LabNewsDetailPage() {
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

  const extractImages = (raw: string) => {
    const images: string[] = []
    let text = raw
    const imgRegex = /!\[[^\]]*\]\((.*?)\)/g
    text = text.replace(imgRegex, (_m: string, url: string) => { images.push(url); return '' })
    return { images, text: text.trim() }
  }

  const parsed = useMemo(() => extractImages(content || item?.content || ''), [item, content])

  const editorText = useMemo(() => parsed.text, [parsed])

  // 이미지 업로드 -> 본문에 자동 삽입
  const onPickImages = async (list: FileList | null) => {
    if (!list) return
    const files = Array.from(list)
    for (const f of files) {
      const fd = new FormData()
      fd.append('file', f)
      const { data } = await api.post('/upload', fd, { headers: { ...withUser() } })
      const url = data.url as string
      setContent(prev => (prev ? prev + '\n' : '') + `![image](${url})`)
    }
  }

  // 편집 중 삭제 표시(시각만 변경). 실제 제거는 저장 시 반영
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')
  const [removingUrls, setRemovingUrls] = useState<Set<string>>(new Set())

  const isOwner = () => {
    const me = localStorage.getItem('lab_user') || ''
    return !!(item && (item.author?.loginId === me || item.author?.name === me))
  }
  const canEdit = () => isAdmin || isOwner()

  const onDelete = async () => {
    try {
      await api.delete(`/notices/${id}`, { headers: withUser() })
      window.location.href = '/news'
    } catch (e: any) { setMsg(e?.response?.data?.message || '삭제 실패') }
  }

  const onSave = async () => {
    try {
      // 저장 시, 삭제 표시된 이미지 마크다운을 본문에서 제거
      let finalContent = content
      removingUrls.forEach((u) => {
        const pattern = new RegExp(`!\\[[^\\]]*\\]\\(${escapeRegExp(u)}\\)`, 'g')
        finalContent = finalContent.replace(pattern, '')
      })
      finalContent = finalContent.replace(/\n{2,}/g, '\n').trim()

      const fd = new FormData()
      fd.append('title', title)
      fd.append('content', finalContent)
      fd.append('category', item?.category || 'NEWS')
      newFiles.forEach(f => fd.append('files', f))
      if (toDelete.size > 0) {
        Array.from(toDelete).forEach(id => fd.append('deleteAttachmentIds', String(id)))
      }
      await api.post(`/notices/${id}/form`, fd, { headers: { ...withUser() } })
      setEditing(false)
      setNewFiles([])
      setToDelete(new Set())
      setRemovingUrls(new Set())
      await api.get<Item>(`/notices/${id}`).then(({ data }) => { setItem(data); setTitle(data.title); setContent(data.content) })
      setMsg('저장되었습니다.')
    } catch (e: any) { setMsg(e?.response?.data?.message || '저장 실패') }
  }

  if (!item) return <div className="container"><div className="section">Loading...</div></div>

  return (
    <div className="container">
      <div className="section" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h1 className="card-title" style={{ fontSize:'2rem', margin:0 }}>{editing ? '수정' : item.title}</h1>
        {canEdit() && (
          <div style={{ display:'flex', gap:8 }}>
            {editing ? (
              <>
          <button onClick={onSave} style={{ padding:'10px 16px', borderRadius:8, background:'#3a4978', color:'#fff', border:'none', fontWeight:800, cursor:'pointer' }}>저장</button>
                <button onClick={()=> { setEditing(false); setTitle(item.title); setContent(item.content); setRemovingUrls(new Set()) }} style={{ padding:'10px 16px', borderRadius:8, background:'#6c757d', color:'#fff', border:'none', fontWeight:800, cursor:'pointer' }}>취소</button>
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
          {parsed.images.length>0 && (
            <div style={{ marginBottom:12, display:'grid', gap:12 }}>
              {parsed.images.map((u,i)=> (
                <div key={i} style={{ position:'relative' }}>
                  <img
                    src={u}
                    alt="news"
                    style={{
                      maxWidth:'100%',
                      height:'auto',
                      objectFit:'contain',
                      borderRadius:8,
                      border:'1px solid #eee',
                      opacity: removingUrls.has(u) ? 0.4 : 1,
                      transition: 'opacity .2s ease'
                    }}
                  />
                  {editing && (
                    <button
                      type="button"
                      onClick={()=> setRemovingUrls(prev => { const next = new Set(prev); next.has(u) ? next.delete(u) : next.add(u); return next }) }
                      className="btn-danger"
                      style={{ position:'absolute', top:8, right:8 }}
                    >{removingUrls.has(u) ? '취소' : '삭제'}</button>
                  )}
                </div>
              ))}
            </div>
          )}
          {(item?.attachments?.length || 0) > 0 && (
            <div style={{ marginBottom:12 }}>
              <ul style={{ margin:0, paddingLeft:18 }}>
                {item?.attachments?.map(a => (
                  <li key={a.id} style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <a href={a.url} target="_blank" rel="noreferrer">{a.name}</a>
                    {editing && (
                      <label style={{ fontSize:12, color:'#c00', cursor:'pointer' }}>
                        <input type="checkbox" onChange={(e) => {
                          const next = new Set(toDelete)
                          if (e.target.checked) next.add(a.id); else next.delete(a.id)
                          setToDelete(next)
                        }} /> 삭제
                      </label>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {editing ? (
            <div style={{ display:'grid', gap:12 }}>
              <input value={title} onChange={(e)=> setTitle(e.target.value)} style={{ width:'100%', padding:'12px 14px', border:'1px solid var(--border-color)', borderRadius:10 }} />
              <textarea
                value={editorText}
                onChange={(e)=> {
                  const text = e.target.value
                  const imageMarkdown = parsed.images.map(u => `![image](${u})`).join('\n')
                  setContent(imageMarkdown + (imageMarkdown && text ? '\n' : '') + text)
                }}
                rows={14}
                style={{ width:'100%', padding:'12px 14px', border:'1px solid var(--border-color)', borderRadius:10, fontFamily:'inherit' }}
              />
              <div>
                <label className="input-label">이미지 추가</label>
                <input type="file" accept="image/*" multiple onChange={(e)=> onPickImages(e.target.files)} />
              </div>
            </div>
          ) : (
            <div style={{ whiteSpace:'pre-wrap', lineHeight:1.7 }}>{parsed.text}</div>
          )}
        </div>
        {msg && <div className="card" style={{ padding:16, marginTop:12 }}>{msg}</div>}
      </div>
    </div>
  )
}


