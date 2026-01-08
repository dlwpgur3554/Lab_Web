import { useEffect, useState } from 'react'
import { api } from '../lib/api'

type Notice = {
  id: number
  title: string
  content: string
  author: { id: number; name: string }
  createdAt: string
  pinned?: boolean
}

export function NoticePage() {
  const [items, setItems] = useState<Notice[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const load = async (p = 0) => {
    const { data } = await api.get(`/notices`, { params: { category: 'NOTICE', page: p, size: 10 } })
    // 고정 글을 상단으로 정렬
    const list = (data.content || []).slice().sort((a: any, b: any) => (b.pinned?1:0) - (a.pinned?1:0))
    setItems(list)
    setPage(data.number)
    setTotalPages(data.totalPages)
  }

  useEffect(() => {
    load()
  }, [])

  const go = (p: number) => { if (p>=0 && p<totalPages) load(p) }

  return (
    <div className="container">
      <div className="section" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h1 className="card-title" style={{ fontSize: '2rem', marginBottom: 0 }}>공지사항</h1>
        {localStorage.getItem('lab_user') && (
          <button
            onClick={() => { window.location.href = '/notices/new' }}
            style={{
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 6,
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              width: 'fit-content',
              transition: 'background 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-primary-dark)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'var(--color-primary)'}
          >
            작성
          </button>
        )}
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
              {items.map((n: any, idx: number) => (
                <tr key={n.id} style={{ borderBottom:'1px solid var(--border-color)' }}>
                  <td style={{ padding:'10px 8px', color:'#666', textAlign:'center' as any }}>{n.pinned ? '-' : (page*10 + idx + 1)}</td>
                  <td style={{ padding:'10px 8px' }}>
                    {n.pinned && <span style={{ display:'inline-block', background:'#dc3545', color:'#fff', borderRadius:4, padding:'2px 6px', fontSize:12, fontWeight:700, marginRight:8 }}>공지</span>}
                    <a href={`/notices/${n.id}`}>{n.title}</a>
                  </td>
                  <td style={{ padding:'10px 8px' }}>{n.author?.name}</td>
                  <td style={{ padding:'10px 8px', textAlign:'center' as any }}>{new Date(n.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={4} style={{ padding:16, color:'var(--color-muted)' }}>등록된 공지가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:16, alignItems:'center' }}>
          <button onClick={()=> go(page-1)} disabled={page===0} style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border-color)', background:'#fff', cursor: page===0? 'not-allowed':'pointer' }}>Prev</button>
          {(() => {
            const tp = Math.max(totalPages, 1)
            const start = Math.max(0, Math.min(page - 2, tp - 5))
            const end = Math.min(tp, start + 5)
            const arr: number[] = []
            for (let i=start; i<end; i++) arr.push(i)
            if (arr.length === 0) arr.push(0)
            return arr.map(pn => (
              <button
                key={pn}
                onClick={()=> go(pn)}
                style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border-color)', background: pn===page? 'var(--color-primary)':'#fff', color: pn===page? '#fff':'var(--color-text)', fontWeight: pn===page? 700:600 }}
              >{pn+1}</button>
            ))
          })()}
          <button onClick={()=> go(page+1)} disabled={page>=Math.max(totalPages,1)-1} style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border-color)', background:'#fff', cursor: page>=Math.max(totalPages,1)-1? 'not-allowed':'pointer' }}>Next</button>
        </div>
      </div>
    </div>
  )
}

// 공지 작성/목록 화면입니다. 권한 부족 시 서버 에러 메시지를 표시합니다.

