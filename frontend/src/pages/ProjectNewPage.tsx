import { FormEvent, useState } from 'react'
import { api, withUser } from '../lib/api'

export function ProjectNewPage() {
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<'PLANNING'|'ONGOING'|'COMPLETED'>('PLANNING')
  const [members, setMembers] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [fileUrls, setFileUrls] = useState<string[]>([])
  const [msg, setMsg] = useState('')

  const uploadImages = async (files: FileList | null) => {
    if (!files) return
    const newUrls: string[] = []
    for (const f of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', f)
      const { data } = await api.post('/upload', fd, { headers: { ...withUser() } })
      newUrls.push(data.url)
    }
    setImages(prev => [...prev, ...newUrls])
  }

  const onPickFiles = async (list: FileList | null) => {
    if (!list) return
    const picked = Array.from(list)
    setFiles(prev => [...prev, ...picked])
    // 업로드만 먼저 수행하고, 본문에는 즉시 삽입하지 않는다
    for (const f of picked) {
      const fd = new FormData()
      fd.append('file', f)
      const { data } = await api.post('/upload', fd, { headers: { ...withUser() } })
      const url = data.url as string
      setFileUrls(prev => [...prev, url])
    }
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const md = images.map(u=>`![image](${u})`).join('\n')
      const filesMd = fileUrls.map(u=>`[파일](${u})`).join('\n')
      const parts = [md, content, filesMd].filter(Boolean)
      const finalDesc = parts.join('\n')
      await api.post('/projects', { title, summary, description: finalDesc, status, members }, { headers: withUser() })
      window.location.href = '/projects'
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Failed')
    }
  }

  return (
    <div className="container">
      <div className="section"><h1 className="card-title" style={{ fontSize:'2rem', margin:0 }}>New Project</h1></div>
      <div className="section">
        <form onSubmit={onSubmit} className="card" style={{ padding:24, display:'grid', gap:14 }}>
          <div>
            <label style={{ display:'block', marginBottom:6, fontWeight:800, color:'#444' }}>Title</label>
            <input value={title} onChange={(e)=> setTitle(e.target.value)} required style={{ width:'100%', padding:'12px 14px', border:'1px solid var(--border-color)', borderRadius:10 }} />
          </div>
          <div>
            <label style={{ display:'block', marginBottom:6, fontWeight:800, color:'#444' }}>Summary</label>
            <input value={summary} onChange={(e)=> setSummary(e.target.value)} placeholder="한 줄 소개" style={{ width:'100%', padding:'12px 14px', border:'1px solid var(--border-color)', borderRadius:10 }} />
          </div>
          <div>
            <label style={{ display:'block', marginBottom:6, fontWeight:800, color:'#444' }}>Status</label>
            <select value={status} onChange={(e)=> setStatus(e.target.value as any)} style={{ width:'100%', padding:'12px 14px', border:'1px solid var(--border-color)', borderRadius:10 }}>
              <option value="PLANNING">계획</option>
              <option value="ONGOING">진행중</option>
              <option value="COMPLETED">완료</option>
            </select>
          </div>
          <div>
            <label style={{ display:'block', marginBottom:6, fontWeight:800, color:'#444' }}>Members</label>
            <input value={members} onChange={(e)=> setMembers(e.target.value)} placeholder="참여 인원(예: 김OO, 이OO)" style={{ width:'100%', padding:'12px 14px', border:'1px solid var(--border-color)', borderRadius:10 }} />
          </div>
          <div>
            <label style={{ display:'block', marginBottom:6, fontWeight:800, color:'#444' }}>Images</label>
            <input type="file" accept="image/*" multiple onChange={(e)=> uploadImages(e.target.files)} />
            {images.length>0 && (
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:10 }}>
                {images.map((u,i)=> <img key={i} src={u} alt="preview" style={{ width:160, height:100, objectFit:'cover', borderRadius:8, border:'1px solid #eee' }} />)}
              </div>
            )}
          </div>
          <div>
            <label style={{ display:'block', marginBottom:6, fontWeight:800, color:'#444' }}>Content</label>
            <textarea value={content} onChange={(e)=> setContent(e.target.value)} rows={12} required style={{ width:'100%', padding:'12px 14px', border:'1px solid var(--border-color)', borderRadius:10, fontFamily:'inherit' }} />
          </div>
          <div>
            <label style={{ display:'block', marginBottom:6, fontWeight:800, color:'#444' }}>첨부파일</label>
            <input type="file" multiple onChange={(e)=> onPickFiles(e.target.files)} />
            {files.length>0 && (
              <ul style={{ margin:0, paddingLeft:18 }}>
                {files.map((f,i)=> <li key={i}>{f.name}</li>)}
              </ul>
            )}
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button type="submit" style={{ padding:'10px 16px', borderRadius:8, background:'#3a4978', color:'#fff', border:'none', fontWeight:800, cursor:'pointer' }}>Save</button>
          </div>
          {msg && <div style={{ color:'#c00' }}>{msg}</div>}
        </form>
      </div>
    </div>
  )
}


