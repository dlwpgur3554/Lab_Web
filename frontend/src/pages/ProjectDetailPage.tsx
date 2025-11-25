import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, withUser } from '../lib/api'

type Project = {
  id: number
  title: string
  description: string
  summary?: string
  createdAt: string
  status?: string
  attachments?: Array<{
    id: number
    name: string
    fileKey?: string
  }>
}

export function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState<Project | null>(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [summary, setSummary] = useState('')
  const [status, setStatus] = useState<'PLANNING'|'ONGOING'|'COMPLETED'>('PLANNING')
  const [members, setMembers] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [authorLoginId, setAuthorLoginId] = useState<string | null>(null)
  const [parsed, setParsed] = useState<{ images:string[]; files:string[]; text:string }>({ images:[], files:[], text:'' })
  const [removingUrls, setRemovingUrls] = useState<Set<string>>(new Set())
  const [removingFileUrls, setRemovingFileUrls] = useState<Set<string>>(new Set())
  const [isAdmin, setIsAdmin] = useState(false)
  const base = api.defaults.baseURL

  const getFileName = (url: string) => {
    try {
      const path = url.split('?')[0]
      const last = path.split('/').pop() || url
      const decoded = decodeURIComponent(last)
      // 업로더에서 붙인 타임스탬프 접두사 "숫자-" 제거
      return decoded.replace(/^\d+-/, '')
    } catch {
      return url
    }
  }

  const onPickImages = async (list: FileList | null) => {
    if (!list) return
    for (const f of Array.from(list)) {
      const fd = new FormData()
      fd.append('file', f)
      const { data } = await api.post('/upload', fd, { headers: { ...withUser() } })
      const url = data.url as string
      setDescription(prev => (prev ? prev + '\n' : '') + `![image](${url})`)
    }
  }

  const onPickFiles = async (list: FileList | null) => {
    if (!list) return
    for (const f of Array.from(list)) {
      const fd = new FormData()
      fd.append('file', f)
      const { data } = await api.post('/upload', fd, { headers: { ...withUser() } })
      const url = data.url as string
      setDescription(prev => (prev ? prev + '\n' : '') + `[파일](${url})`)
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get<Project>(`/projects/${id}`)
        setItem(data)
        setTitle(data.title)
        setDescription(data.description)
        setStatus((data.status as any) || 'PLANNING')
        // @ts-ignore
        setMembers((data as any).members || '')
        // @ts-ignore
        setAuthorName((data as any).createdBy?.name || '')
        // @ts-ignore
        setAuthorLoginId((data as any).createdBy?.loginId || null)
        // @ts-ignore
        setSummary((data as any).summary || '')
        // parse description for images/files
        const desc = (data as any).description || ''
        const imgRegex = /!\[[^\]]*\]\((.*?)\)/g
        const fileRegex = /\[파일\]\(([^)]+)\)/g
        const images:string[] = []
        const files:string[] = []
        let text = desc
        text = text.replace(imgRegex, (_m: string, url: string)=>{ images.push(url); return '' })
        text = text.replace(fileRegex, (_m: string, url: string)=>{ files.push(url); return '' })
        // plain image URLs (jpg|jpeg|png|gif|webp)
        const urlRegex = /(https?:\/\/[^\s)]+\.(?:png|jpg|jpeg|gif|webp))/gi
        text = text.replace(urlRegex, (_m: string, url: string)=>{ images.push(url); return '' })
        setParsed({ images, files, text: text.trim() })
      } catch (e: any) {
        setError(e?.response?.data?.message || '로딩 실패')
      }
    }
    load()
  }, [id])

  useEffect(() => {
    const me = localStorage.getItem('lab_user')
    if (!me) return
    api.get<any>(`/members/me`, { headers: withUser() })
      .then(({ data }) => setIsAdmin(!!data.admin))
      .catch(() => setIsAdmin(false))
  }, [])

  // 편집 여부에 따라 실시간 파싱(편집 중엔 description 기준으로 파싱하여 미리보기/삭제 토글 반영)
  const parsedNow = useMemo(() => {
    const source = editing ? description : (item?.description || '')
    const imgRegex = /!\[[^\]]*\]\((.*?)\)/g
    const fileRegex = /\[파일\]\(([^)]+)\)/g
    const images:string[] = []
    const files:string[] = []
    let text = source
    text = text.replace(imgRegex, (_m: string, url: string)=>{ images.push(url); return '' })
    text = text.replace(fileRegex, (_m: string, url: string)=>{ files.push(url); return '' })
    const urlRegex = /(https?:\/\/[^\s)]+\.(?:png|jpg|jpeg|gif|webp))/gi
    text = text.replace(urlRegex, (_m: string, url: string)=>{ images.push(url); return '' })
    // 백엔드가 첨부 배열을 제공하는 경우 병합 표시
    const extraFiles = (item?.attachments || []).map(a => (a.fileKey ? `${(api.defaults.baseURL || '').replace(/\/$/, '')}/notices/files/download?fileKey=${a.fileKey}` : a.name)).filter(Boolean) as string[]
    const mergedFiles = Array.from(new Set([...files, ...extraFiles]))
    return { images, files: mergedFiles, text: text.trim() }
  }, [editing, description, item])

  const isOwner = () => {
    const me = localStorage.getItem('lab_user')
    if (!me || !authorLoginId) return false
    return authorLoginId === me || authorName === me
  }
  const canEdit = () => isAdmin || isOwner()

  if (!item) return <div className="container"><div className="section">Loading...</div></div>

  return (
    <div className="container">
      <div className="section">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h1 className="card-title" style={{ fontSize:'2rem', marginBottom: 0 }}>{editing ? '프로젝트 수정' : item.title}</h1>
          {!editing && canEdit() && (
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=> setEditing(true)} className="btn-secondary">수정</button>
              <button onClick={async()=>{ if (!confirm('삭제하시겠습니까?')) return; await api.delete(`/projects/${id}`, { headers: withUser() }); navigate('/projects') }} className="btn-danger">삭제</button>
            </div>
          )}
        </div>
      </div>
      <div className="section">
        <div className="card" style={{ padding: 24 }}>
          {editing ? (
            <form style={{ display:'grid', gap:14 }} onSubmit={async (e)=>{ e.preventDefault();
              // remove images marked for deletion
              const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')
              let finalDesc = description
              removingUrls.forEach(u=> {
                const pattern = new RegExp(`!\\[[^\\]]*\\]\\(${escapeRegExp(u)}\\)`, 'g')
                finalDesc = finalDesc.replace(pattern, '')
              })
              // remove files marked for deletion (no-regex to avoid paren issues)
              removingFileUrls.forEach(u => {
                const token = `[파일](${u})`
                if (finalDesc.includes(token)) {
                  finalDesc = finalDesc.split(token).join('')
                }
              })
              finalDesc = finalDesc.replace(/\n{2,}/g, '\n').trim()
              await api.put(`/projects/${id}`, { title, summary, description: finalDesc, status, members }, { headers: withUser() });
              setEditing(false); setRemovingUrls(new Set()); setRemovingFileUrls(new Set()); const { data } = await api.get<Project>(`/projects/${id}`); setItem(data); }}>
              <div>
                <label className="input-label">Title</label>
                <input value={title} onChange={(e)=> setTitle(e.target.value)} className="input-field" required />
              </div>
              <div>
                <label className="input-label">Summary</label>
                <input value={summary} onChange={(e)=> setSummary(e.target.value)} className="input-field" placeholder="한 줄 소개" />
              </div>
              <div>
                <label className="input-label">Status</label>
                <select value={status} onChange={(e)=> setStatus(e.target.value as any)} className="input-field">
                  <option value="PLANNING">계획</option>
                  <option value="ONGOING">진행중</option>
                  <option value="COMPLETED">완료</option>
                </select>
              </div>
              <div>
                <label className="input-label">Members</label>
                <input value={members} onChange={(e)=> setMembers(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="input-label">이미지 추가</label>
                <input type="file" accept="image/*" multiple onChange={(e)=> onPickImages(e.target.files)} />
              </div>
              {parsedNow.images.length>0 && (
                <div style={{ display:'grid', gap:12 }}>
                  {parsedNow.images.map((u,i)=> (
                    <div key={i} style={{ position:'relative' }}>
                      <img src={u} alt="img" style={{ maxWidth:'100%', height:'auto', objectFit:'contain', borderRadius:8, border:'1px solid #eee', opacity: removingUrls.has(u)? 0.4 : 1, transition:'opacity .2s ease' }} />
                      <button type="button" onClick={()=> setRemovingUrls(prev => { const next = new Set(prev); next.has(u) ? next.delete(u) : next.add(u); return next }) } className="btn-danger" style={{ position:'absolute', top:8, right:8 }}>{removingUrls.has(u)? '취소' : '삭제'}</button>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <label className="input-label">첨부파일 추가</label>
                <input type="file" multiple onChange={(e)=> onPickFiles(e.target.files)} />
              </div>
              <div>
                <label className="input-label">Content</label>
                <textarea value={parsedNow.text} onChange={(e)=> { const text = e.target.value; const imgmd = parsedNow.images.map(u=> `![image](${u})`).join('\n'); setDescription(imgmd + (imgmd && text ? '\n' : '') + text) }} rows={12} className="input-field" required />
              </div>
              <div style={{ padding:16, backgroundColor:'#f8f9fa', borderRadius:8, border:'1px solid #e9ecef' }}>
                <h4 style={{ margin:'0 0 12px 0', fontSize:'16px', fontWeight:'bold', color:'#495057' }}>기존 첨부파일</h4>
                {parsedNow.files.length>0 ? (
                  <ul style={{ margin:0, paddingLeft:18 }}>
                    {parsedNow.files.map((u,i) => (
                      <li key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                        <span style={{ fontSize:'14px', color:'#6c757d' }}>📎</span>
                        <a href={u} target="_blank" rel="noreferrer">{getFileName(u)}</a>
                        <button type="button" onClick={()=> setRemovingFileUrls(prev => { const next = new Set(prev); next.has(u) ? next.delete(u) : next.add(u); return next }) } className="btn-danger" style={{ marginLeft:'auto' }}>{removingFileUrls.has(u)? '취소' : '삭제'}</button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ color:'#6c757d', fontSize:14 }}>첨부파일 없음</div>
                )}
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
                <button type="submit" className="btn-primary">저장</button>
                <button type="button" onClick={()=> { setEditing(false); setRemovingUrls(new Set()); setRemovingFileUrls(new Set()) }} className="btn-secondary">취소</button>
              </div>
            </form>
          ) : (
            <>
              <div className="card-meta" style={{ marginBottom: 8 }}>
                <span>작성자: {authorName || '-'}</span>
                <span style={{ marginLeft: 12 }}>{new Date(item.createdAt).toLocaleString()}</span>
              </div>
              <div className="card-meta" style={{ marginBottom: 12 }}>
                <span>상태: {status === 'PLANNING' ? '계획' : status === 'ONGOING' ? '진행중' : status === 'COMPLETED' ? '완료' : '-'}</span>
                <span style={{ marginLeft: 12 }}>인원: {(item as any).members || '-'}</span>
              </div>
              {/* 한줄 소개 */}
              {(item.summary || '').trim() && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ margin: 0, color:'var(--color-text)' }}>{item.summary}</p>
                </div>
              )}
              {/* 내용 */}
              <div style={{ marginTop: 12 }}>
                <p style={{ whiteSpace:'pre-wrap', lineHeight: 1.6, color: 'var(--color-text)', margin: 0 }}>{parsed.text || item.description}</p>
              </div>
              {/* 이미지 */}
              {parsedNow.images.length>0 && (
                <div style={{ display:'grid', gap:12, marginTop: 16 }}>
                  {parsedNow.images.map((u,i)=> (
                    <div key={i} style={{ position:'relative' }}>
                      <img src={u} alt="img" style={{ maxWidth:'100%', height:'auto', objectFit:'contain', borderRadius:8, border:'1px solid #eee' }} />
                    </div>
                  ))}
                </div>
              )}
              {/* 첨부파일 (표시용) */}
              <div style={{ marginTop:16, padding:16, backgroundColor:'#f8f9fa', borderRadius:8, border:'1px solid #e9ecef' }}>
                <h4 style={{ margin:'0 0 12px 0', fontSize:'16px', fontWeight:'bold', color:'#495057' }}>첨부파일</h4>
                {parsedNow.files.length>0 ? (
                  <ul style={{ margin:0, paddingLeft:18 }}>
                    {parsedNow.files.map((u,i)=> (
                      <li key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                        <span style={{ fontSize:'14px', color:'#6c757d' }}>📎</span>
                        <a href={u} target="_blank" rel="noreferrer">{getFileName(u)}</a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ color:'#6c757d', fontSize:14 }}>첨부파일 없음</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      {error && <div className="section"><div className="card" style={{ padding: 16, color: '#c00' }}>{error}</div></div>}
    </div>
  )
}


