import { FormEvent, useState } from 'react'
import { api, withUser } from '../lib/api'

export function LabNewsNewPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [msg, setMsg] = useState('')

  const onPickImages = (list: FileList | null) => {
    if (!list) return
    setImages(prev => [...prev, ...Array.from(list)])
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      // 이미지 업로드 → 절대 URL 획득 → 본문에 마크다운 이미지로 삽입
      let body = content
      for (const f of images) {
        const fd = new FormData()
        fd.append('file', f)
        const { data } = await api.post('/upload', fd, { headers: { ...withUser() } })
        body = (body ? body + '\n' : '') + `![image](${data.url})`
      }
      await api.post('/notices', { title, content: body, category: 'NEWS' }, { headers: withUser() })
      window.location.href = '/news'
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Failed')
    }
  }

  return (
    <div className="container">
      <div className="section"><h1 className="card-title" style={{ fontSize:'2rem', margin:0 }}>New Laboratory News</h1></div>
      <div className="section">
        <form onSubmit={onSubmit} className="card" style={{ padding:24, display:'grid', gap:14 }}>
          <div>
            <label style={{ display:'block', marginBottom:6, fontWeight:800, color:'#444' }}>Title</label>
            <input value={title} onChange={(e)=> setTitle(e.target.value)} required style={{ width:'100%', padding:'12px 14px', border:'1px solid var(--border-color)', borderRadius:10 }} />
          </div>
          <div>
            <label style={{ display:'block', marginBottom:6, fontWeight:800, color:'#444' }}>Images</label>
            <input type="file" accept="image/*" multiple onChange={(e)=> onPickImages(e.target.files)} />
            {images.length>0 && (
              <ul style={{ marginTop:8 }}>
                {images.map((f,i)=> <li key={i}>{f.name}</li>)}
              </ul>
            )}
          </div>
          <div>
            <label style={{ display:'block', marginBottom:6, fontWeight:800, color:'#444' }}>Content</label>
            <textarea value={content} onChange={(e)=> setContent(e.target.value)} rows={12} required style={{ width:'100%', padding:'12px 14px', border:'1px solid var(--border-color)', borderRadius:10, fontFamily:'inherit' }} />
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


