import { useEffect, useState } from 'react'
import { api } from '../lib/api'

type Project = {
  id: number
  title: string
  description: string
  summary?: string
  createdAt: string
}

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const loadProjects = async (p = 0) => {
    try {
      const { data } = await api.get(`/projects`, { params: { page: p, size: 10 } })
      // 백엔드는 아직 페이지네이션 미구현일 수 있어 가드 처리
      if (Array.isArray(data)) {
        setProjects(data.slice(0, 10))
        setPage(0)
        setTotalPages(1)
      } else {
        setProjects(data.content)
        setPage(data.number)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('프로젝트 로딩 실패:', error)
    }
  }

  useEffect(() => {
    loadProjects(0)
  }, [])

  return (
    <div className="container">
      <div className="section" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h1 className="card-title" style={{ fontSize: '2rem', marginBottom: 0 }}>연구 프로젝트</h1>
        {localStorage.getItem('lab_user') && (
          <button
            onClick={() => { window.location.href = '/projects/new' }}
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
            등록
          </button>
        )}
      </div>

      <div className="section">
        <div className="grid" style={{ gap: 16 }}>
          {projects.map((project) => (
            <a key={project.id} className="card card-item" href={`/projects/${project.id}`} style={{ textDecoration:'none' }}>
              <h3 className="card-title" style={{ marginBottom: 6 }}>{project.title}</h3>
              <p style={{ color: 'var(--color-text)', lineHeight: 1.6 }}>{project.summary || project.description}</p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', fontSize: '0.9rem', color: 'var(--color-muted)', marginTop: 10 }}>
                <span>생성일: {new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
            </a>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)' }}>
            등록된 프로젝트가 없습니다.
          </div>
        )}
        <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:16, alignItems:'center' }}>
          <button onClick={()=> loadProjects(page-1)} disabled={page===0} style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border-color)', background:'#fff' }}>Prev</button>
          {(() => {
            const tp = Math.max(totalPages, 1)
            const start = Math.max(0, Math.min(page - 2, tp - 5))
            const end = Math.min(tp, start + 5)
            const arr: number[] = []
            for (let i=start; i<end; i++) arr.push(i)
            if (arr.length === 0) arr.push(0)
            return arr.map(pn => (
              <button key={pn} onClick={()=> loadProjects(pn)} style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border-color)', background: pn===page? 'var(--color-primary)':'#fff', color: pn===page? '#fff':'var(--color-text)', fontWeight: pn===page? 700:600 }}>{pn+1}</button>
            ))
          })()}
          <button onClick={()=> loadProjects(page+1)} disabled={page>=Math.max(totalPages,1)-1} style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border-color)', background:'#fff' }}>Next</button>
        </div>
      </div>
    </div>
  )
}

