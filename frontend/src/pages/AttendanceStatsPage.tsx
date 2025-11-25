import { useEffect, useMemo, useState } from 'react'
import { api, withUser } from '../lib/api'

type Member = { id:number; name:string; role:string; admin?: boolean }
type Attendance = { id:number; workDate:string; checkInAt?:string; checkOutAt?:string; member?: Member }
type StatsDto = { start:string; end:string; members:Member[]; records:Attendance[] }

export function AttendanceStatsPage() {
  const [data, setData] = useState<StatsDto | null>(null)
  const [msg, setMsg] = useState('')

  const [ym, setYm] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` })
  const [isNarrow, setIsNarrow] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 1100 : false)
  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 1100)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  useEffect(() => {
    api.get<StatsDto>('/attendance/stats/', { params:{ month: ym }, headers: withUser() })
      .then(({ data }) => setData(data))
      .catch((e:any) => setMsg(e?.response?.data?.message || '통계 로드 실패'))
  }, [ym])

  const todayStatus = useMemo(() => {
    if (!data) return [] as { member: Member; checkIn?: string; checkOut?: string }[]
    const map = new Map<number, { checkIn?: string; checkOut?: string }>()
    const today = new Date().toISOString().slice(0,10)
    for (const r of data.records || []) {
      if (r.workDate === today) {
        map.set((r as any).member?.id || 0, { checkIn: r.checkInAt, checkOut: r.checkOutAt })
      }
    }
    const members = (data.members || []).filter(m => m.role === 'MEMBER')
    return members.map(m => ({ member: m, ...(map.get(m.id) || {}) }))
  }, [data])

  const monthMatrix = useMemo(() => {
    if (!data) return { days: [] as number[], rows: [] as { member: Member; marks: string[] }[] }
    const start = new Date(data.start)
    const daysInMonth = new Date(start.getFullYear(), start.getMonth()+1, 0).getDate()
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    const members = (data.members || []).filter(m => m.role === 'MEMBER')
    const rows = members.map(member => {
      const marks = days.map(d => {
        const dateStr = `${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
        const rec = (data.records || []).find(r => (r as any).member?.id === member.id && r.workDate === dateStr)
        if (!rec) return ''
        if (rec.checkInAt && rec.checkOutAt) return '●'
        if (rec.checkInAt && !rec.checkOutAt) return '○'
        return ''
      })
      return { member, marks }
    })
    return { days, rows }
  }, [data])

  // 고정 공휴일(양력) 계산
  const holidaySet = useMemo(() => {
    if (!data) return new Set<string>()
    const d = new Date(data.start)
    const y = d.getFullYear()
    const list = [
      `${y}-01-01`, // 신정
      `${y}-03-01`, // 삼일절
      `${y}-05-05`, // 어린이날
      `${y}-06-06`, // 현충일
      `${y}-08-15`, // 광복절
      `${y}-10-03`, // 개천절
      `${y}-10-09`, // 한글날
      `${y}-12-25`  // 성탄절
    ]
    return new Set(list)
  }, [data])

  return (
    <div className="container">
      <div className="section" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h1 className="card-title" style={{ fontSize:'2rem', marginBottom:0 }}>출퇴근 통계</h1>
        <div style={{ color:'var(--color-muted)' }}>{data && `${data.start} ~ ${data.end}`}</div>
      </div>

      {msg && (
        <div className="section"><div className="card" style={{ padding:16, color:'#c00' }}>{msg}</div></div>
      )}

      {/* 오늘 상태 */}
      <div className="section">
        <div className="card" style={{ padding: 24 }}>
          <h2 className="card-title" style={{ marginBottom: 12 }}>오늘 출퇴근 상태</h2>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'2px solid var(--border-color)' }}>
                <th style={{ padding:10, textAlign:'left' }}>이름</th>
                <th style={{ padding:10, textAlign:'center' }}>출근</th>
                <th style={{ padding:10, textAlign:'center' }}>퇴근</th>
              </tr>
            </thead>
            <tbody>
              {todayStatus.map(({ member, checkIn, checkOut }) => (
                <tr key={member.id} style={{ borderBottom:'1px solid var(--border-color)' }}>
                  <td style={{ padding:10 }}>{member.name}</td>
                  <td style={{ padding:10, textAlign:'center', color:'#28a745', fontWeight:700 }}>{checkIn ? new Date(checkIn).toLocaleTimeString() : '-'}</td>
                  <td style={{ padding:10, textAlign:'center', color:'#dc3545', fontWeight:700 }}>{checkOut ? new Date(checkOut).toLocaleTimeString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 월 선택 & 월별 현황 + 오른쪽 평균 패널 */}
      <div className="section">
        <div style={{ display:'grid', gridTemplateColumns: isNarrow ? '1fr' : 'minmax(0,1fr) 280px', gap:16 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <h2 className="card-title" style={{ margin:0 }}>월별 현황</h2>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <button className="btn-secondary" onClick={()=>{
                  const [y,m] = ym.split('-').map(Number)
                  const d = new Date(y, m-2, 1)
                  setYm(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`)
                }}>이전달</button>
                <strong>{ym}</strong>
                <button className="btn-secondary" onClick={()=>{
                  const [y,m] = ym.split('-').map(Number)
                  const d = new Date(y, m, 1)
                  setYm(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`)
                }}>다음달</button>
              </div>
            </div>
            <div style={{ overflowX:'auto' }}>
            <table style={{ borderCollapse:'collapse', width:'100%' }}>
              <thead>
                <tr style={{ borderBottom:'2px solid var(--border-color)' }}>
                  <th style={{ padding:10, textAlign:'left', whiteSpace:'nowrap' }}>이름</th>
                  {monthMatrix.days.map(d => {
                    const parts = (data?.start || `${ym}-01`).split('-')
                    const y = Number(parts[0])
                    const m = Number(parts[1])
                    // JS Date: month is 0-based
                    const date = new Date(y, m - 1, d)
                    const w = date.getDay()
                    const isSun = w === 0
                    const isSat = w === 6
                    const key = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
                    const isHoliday = holidaySet.has(key)
                    const color = isHoliday || isSun ? '#c62828' : (isSat ? '#1565c0' : undefined)
                    return (
                      <th key={d} style={{ padding:6, textAlign:'center', fontSize:12, color }}>{d}</th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {monthMatrix.rows.map(row => (
                  <tr key={row.member.id} style={{ borderBottom:'1px solid var(--border-color)' }}>
                    <td style={{ padding:10, whiteSpace:'nowrap' }}>{row.member.name}</td>
                    {row.marks.map((mark, i) => {
                      const parts = (data?.start || `${ym}-01`).split('-')
                      const y = Number(parts[0])
                      const mth = Number(parts[1])
                      const date = new Date(y, mth - 1, i + 1)
                      const weekday = date.getDay()
                      const isSun = weekday === 0
                      const isSat = weekday === 6
                      const key = `${y}-${String(mth).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`
                      const isHoliday = holidaySet.has(key)
                      const baseColor = mark==='●' ? '#28a745' : (mark==='○' ? '#ff7a00' : undefined)
                      const dayColor = (isHoliday || isSun) ? '#c62828' : (isSat ? '#1565c0' : undefined)
                      const color = baseColor || dayColor
                      const bg = (isHoliday || isSun) ? '#fdecea' : (isSat ? '#e8f1fd' : undefined)
                      return (
                        <td key={i} style={{ padding:4, textAlign:'center', color, background:bg }}>{mark}</td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
          {/* 월별 평균 출/퇴근 시간 - 별도 오른쪽 카드 */}
          <MonthlyAverages ym={ym} data={data} />
        </div>
      </div>
    </div>
  )
}

function MonthlyAverages({ ym, data }: { ym: string; data: StatsDto | null }) {
  if (!data) return <div />
  const [y, m] = ym.split('-').map(Number)
  const start = new Date(y, m - 1, 1)
  const end = new Date(y, m, 0)
  const inMonth = (iso?: string) => {
    if (!iso) return false
    const d = new Date(iso)
    return d.getFullYear() === y && (d.getMonth()+1) === m
  }
  const toMin = (iso: string) => { const d = new Date(iso); return d.getHours()*60 + d.getMinutes() }
  const fmt = (mins: number | null) => mins == null ? '-' : `${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`

  const members = (data.members || []).filter(mb => mb.role === 'MEMBER')
  const rows = members.map(mb => {
    const recs = (data.records || []).filter(r => (r as any).member?.id === mb.id && r.workDate >= `${y}-${String(m).padStart(2,'0')}-01` && r.workDate <= `${y}-${String(m).padStart(2,'0')}-${String(end.getDate()).padStart(2,'0')}`)
    const ins:number[] = []; const outs:number[] = []
    recs.forEach(r => { if (inMonth(r.checkInAt)) ins.push(toMin(r.checkInAt!)); if (inMonth(r.checkOutAt)) outs.push(toMin(r.checkOutAt!)) })
    const avgIn = ins.length ? Math.round(ins.reduce((a,b)=>a+b,0)/ins.length) : null
    const avgOut = outs.length ? Math.round(outs.reduce((a,b)=>a+b,0)/outs.length) : null
    return { member: mb, avgIn, avgOut }
  })

  return (
    <div className="card" style={{ padding:16 }}>
      <h3 className="card-title" style={{ marginTop:0, marginBottom:12 }}>월별 평균</h3>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr style={{ borderBottom:'2px solid var(--border-color)' }}>
            <th style={{ padding:8, textAlign:'left' }}>이름</th>
            <th style={{ padding:8, textAlign:'center' }}>평균 출근</th>
            <th style={{ padding:8, textAlign:'center' }}>평균 퇴근</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.member.id} style={{ borderBottom:'1px solid var(--border-color)' }}>
              <td style={{ padding:8 }}>{r.member.name}</td>
              <td style={{ padding:8, textAlign:'center', color:'#28a745', fontWeight:700 }}>{fmt(r.avgIn)}</td>
              <td style={{ padding:8, textAlign:'center', color:'#dc3545', fontWeight:700 }}>{fmt(r.avgOut)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


