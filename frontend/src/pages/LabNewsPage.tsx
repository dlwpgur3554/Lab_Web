import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

type News = {
  id: number
  title: string
  content: string
  createdAt: string
  author?: { id:number; name:string }
}

export function LabNewsPage() {
  const [items, setItems] = useState<News[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const load = async (p = 0) => {
    const { data } = await api.get('/notices', { params: { category: 'NEWS', page: p, size: 10 } })
    setItems(data.content)
    setPage(data.number)
    setTotalPages(data.totalPages)
  }

  useEffect(() => { load(0) }, [])

  return (
    <div className="container">
      <div className="section" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h1 className="card-title" style={{ fontSize: '2rem', marginBottom: 0 }}>연구실 소식</h1>
        <button
          onClick={() => { window.location.href = '/news/new' }}
          style={{
            background: 'var(--color-primary)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 6,
            fontSize: '1rem', fontWeight: 600, cursor: 'pointer', width: 'fit-content', transition: 'background 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-primary-dark)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'var(--color-primary)'}
        >
          Write
        </button>
      </div>
      <div className="section">
        <div className="list-card">
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'2px solid var(--border-color)', textAlign:'left' }}>
                <th style={{ width:80, padding:'10px 8px', textAlign:'center' as any }}>번호</th>
                <th style={{ padding:'10px 8px' }}>제목</th>
                <th style={{ width:160, padding:'10px 8px' }}>작성자</th>
                <th style={{ width:140, padding:'10px 8px', textAlign:'center' as any }}>등록일</th>
              </tr>
            </thead>
            <tbody>
              {items.map((n, idx) => (
                <tr key={n.id} style={{ borderBottom:'1px solid var(--border-color)' }}>
                  <td style={{ padding:'10px 8px', color:'#666', textAlign:'center' as any }}>{page*10 + idx + 1}</td>
                  <td style={{ padding:'10px 8px' }}>
                    <Link to={`/news/${n.id}`}>{n.title}</Link>
                  </td>
                  <td style={{ padding:'10px 8px' }}>{n.author?.name || ''}</td>
                  <td style={{ padding:'10px 8px', textAlign:'center' as any }}>{new Date(n.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={4} style={{ padding:16, color:'var(--color-muted)' }}>No items.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:16, alignItems:'center' }}>
        <button onClick={()=> load(page-1)} disabled={page===0} style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border-color)', background:'#fff' }}>Prev</button>
        {(() => {
          const tp = Math.max(totalPages, 1)
          const start = Math.max(0, Math.min(page - 2, tp - 5))
          const end = Math.min(tp, start + 5)
          const arr: number[] = []
          for (let i=start; i<end; i++) arr.push(i)
          if (arr.length === 0) arr.push(0)
          return arr.map(pn => (
            <button key={pn} onClick={()=> load(pn)} style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border-color)', background: pn===page? 'var(--color-primary)':'#fff', color: pn===page? '#fff':'var(--color-text)', fontWeight: pn===page? 700:600 }}>{pn+1}</button>
          ))
        })()}
        <button onClick={()=> load(page+1)} disabled={page>=Math.max(totalPages,1)-1} style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border-color)', background:'#fff' }}>Next</button>
      </div>
    </div>
    </div>
  )
}


