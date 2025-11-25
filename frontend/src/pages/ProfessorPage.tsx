import { useEffect, useState } from 'react'
import { api } from '../lib/api'

type Member = {
  id: number
  name: string
  role: string
  email?: string
  phone?: string
  bio?: string
  researchArea?: string
  photoUrl?: string
  degree?: string
}

export function ProfessorPage() {
  const [professors, setProfessors] = useState<Member[]>([])
  const extra: Record<string, { labRoom?: string; labFacility?: string; englishName?: string; degree?: string; researchArea?: string; phone?: string; email?: string }> = {
    '신광성': {
      labRoom: '공과대학 3호관 518호',
      labFacility: '공과대학 3호관 403호 실감 멀티미디어 실험실',
      englishName: 'Shin, Kwang‑Seong',
      degree: '멀티미디어/공학박사',
      researchArea: '실감 멀티미디어',
      phone: '061-750-3623',
      email: 'waver@scnu.ac.kr'
    }
  }

  useEffect(() => {
    api.get<Member[]>('/members').then(({ data }) => {
      setProfessors(data.filter(m => m.role === 'PROFESSOR'))
    })
  }, [])

  return (
    <div className="container" style={{ padding: 20 }}>
      <h1 style={{ fontSize: '2rem', marginBottom: 16 }}>Professor</h1>
      <div style={{ display:'grid', gap:20 }}>
        {professors.map(p => (
          <div key={p.id} className="card" style={{ padding:24 }}>
            <div style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap:20, alignItems:'start' }}>
              <div>
                {p.photoUrl && (
                  <img
                    src={p.photoUrl}
                    alt={p.name}
                    style={{
                      width: 120,
                      height: 160,
                      objectFit: 'cover',
                      borderRadius: 6,
                      border: '1px solid #e5e7eb',
                      background: '#fff'
                    }}
                  />
                )}
              </div>
              <div>
                <h2 className="card-title" style={{ fontSize:'1.4rem', margin:'0 0 8px 0' }}>{p.name} <span style={{ fontWeight:400, fontSize:14, color:'#6b7280' }}>{extra[p.name]?.englishName ? `(${extra[p.name]?.englishName})` : ''}</span></h2>
                {p.bio && (
                  <p style={{ margin:'0 0 12px 0', lineHeight:1.8, color:'#2a2a2a' }}>{p.bio}</p>
                )}
                <div style={{ display:'grid', gap:8, fontSize:15, color:'#334155' }}>
                  <div><strong style={{ display:'inline-block', width:96, color:'#111827' }}>전공/학위</strong> {extra[p.name]?.degree || p.degree || '-'}</div>
                  <div><strong style={{ display:'inline-block', width:96, color:'#111827' }}>연구 분야</strong> {extra[p.name]?.researchArea || p.researchArea || '-'}</div>
                  <div><strong style={{ display:'inline-block', width:96, color:'#111827' }}>전화번호</strong> {extra[p.name]?.phone || p.phone || '-'}</div>
                  <div><strong style={{ display:'inline-block', width:96, color:'#111827' }}>이메일</strong> {extra[p.name]?.email || p.email || '-'}</div>
                  <div><strong style={{ display:'inline-block', width:96, color:'#111827' }}>연구실</strong> {extra[p.name]?.labRoom || '-'}</div>
                  <div><strong style={{ display:'inline-block', width:96, color:'#111827' }}>실험실</strong> {extra[p.name]?.labFacility || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


