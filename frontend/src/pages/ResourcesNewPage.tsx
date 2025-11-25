import { FormEvent, useState } from 'react'
import { api, withUser } from '../lib/api'

export function ResourcesNewPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [msg, setMsg] = useState('')

  const onPickFiles = (list: FileList | null) => {
    if (!list) return
    setFiles(prev => [...prev, ...Array.from(list)])
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const fd = new FormData()
      fd.append('title', title)
      fd.append('content', content)
      fd.append('category', 'RESOURCE')
      files.forEach(f => fd.append('files', f))
      await api.post('/notices', fd, { headers: { ...withUser() } })
      window.location.href = '/resources'
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Failed')
    }
  }

  return (
    <div className="container">
      <div className="section"><h1 className="card-title" style={{ fontSize:'2rem', margin:0 }}>New Resource</h1></div>
      <div className="section">
        <form onSubmit={onSubmit} className="card" style={{ padding:24, display:'grid', gap:14 }}>
          <div>
            <label style={{ display:'block', marginBottom:6, fontWeight:800, color:'#444' }}>Title</label>
            <input value={title} onChange={(e)=> setTitle(e.target.value)} required style={{ width:'100%', padding:'12px 14px', border:'1px solid var(--border-color)', borderRadius:10 }} />
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


