import { FormEvent, useState } from 'react'
import { api, withUser } from '../lib/api'

export function NoticeNewPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [msg, setMsg] = useState('')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/notices', { title, content, category: 'NOTICE' }, { headers: withUser() })
      window.location.href = '/notices'
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Failed')
    }
  }

  const inputStyle: React.CSSProperties = { width:'100%', padding:'12px 14px', border:'1px solid var(--border-color)', borderRadius:10, fontSize:'1rem', outline:'none', background:'#fff' }
  const labelStyle: React.CSSProperties = { display:'block', marginBottom:6, fontWeight:800, color:'#444' }

  return (
    <div className="container">
      <div className="section"><h1 className="card-title" style={{ fontSize:'2rem', margin:0 }}>New Notice</h1></div>
      <div className="section">
        <form onSubmit={onSubmit} className="card" style={{ padding:24, display:'grid', gap:14 }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input value={title} onChange={(e)=> setTitle(e.target.value)} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Content</label>
            <textarea value={content} onChange={(e)=> setContent(e.target.value)} rows={12} required style={{ ...inputStyle, fontFamily:'inherit' }} />
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


