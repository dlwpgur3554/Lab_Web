import { FormEvent, useEffect, useMemo, useState } from 'react'
import { api, withUser } from '../lib/api'

type EventItem = {
  id: number
  title: string
  startAt: string
  endAt: string
  // 백엔드에서 개인 카테고리를 '개인'으로 내려줄 수 있어 문자열로 둡니다
  category?: string
}

export function CalendarPage() {
  const [items, setItems] = useState<EventItem[]>([])
  const [title, setTitle] = useState('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [category, setCategory] = useState<'Laboratory' | 'Personal'>('Laboratory')
  const [current, setCurrent] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const ymLabel = useMemo(() => {
    const y = current.getFullYear()
    const m = String(current.getMonth() + 1).padStart(2, '0')
    return `${y}.${m}`
  }, [current])

  const startOfMonth = useMemo(() => new Date(current.getFullYear(), current.getMonth(), 1), [current])
  const endOfMonth = useMemo(() => new Date(current.getFullYear(), current.getMonth() + 1, 0), [current])
  const firstWeekday = useMemo(() => startOfMonth.getDay(), [startOfMonth])
  const daysInMonth = useMemo(() => endOfMonth.getDate(), [endOfMonth])

  const firstCellDate = useMemo(() => {
    const d = new Date(startOfMonth)
    d.setDate(d.getDate() - firstWeekday)
    return d
  }, [startOfMonth, firstWeekday])

  const cells = useMemo(() => {
    return Array.from({ length: 42 }).map((_, idx) => {
      const d = new Date(firstCellDate)
      d.setDate(firstCellDate.getDate() + idx)
      const inCurrent = d.getMonth() === current.getMonth()
      return { date: d, inCurrent }
    })
  }, [firstCellDate, current])

  const holidaySet = useMemo(() => {
    const y = current.getFullYear()
    const fixed = [
      `${y}-01-01`, // 신정
      `${y}-03-01`, // 삼일절
      `${y}-05-05`, // 어린이날
      `${y}-06-06`, // 현충일
      `${y}-08-15`, // 광복절
      `${y}-10-03`, // 개천절
      `${y}-10-09`, // 한글날
      `${y}-12-25`  // 성탄절
    ]
    return new Set(fixed)
  }, [current])

  const isHoliday = (d: Date) => holidaySet.has(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)

  const load = async () => {
    const { data } = await api.get<EventItem[]>('/events', { headers: withUser() })
    setItems(data)
  }

  useEffect(() => {
    load()
  }, [])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await api.post(
      '/events',
      { title, startAt: new Date(startAt).toISOString(), endAt: new Date(endAt).toISOString(), category },
      { headers: withUser() }
    )
    setTitle('')
    setStartAt('')
    setEndAt('')
    setCategory('Laboratory')
    await load()
  }

  // 편집 상태
  const [editing, setEditing] = useState<EventItem | undefined>(undefined)
  const [toast, setToast] = useState<string>('')

  const palette = ['#e6f4ea','#fff4e0','#e7f0fe','#fce8e6','#f3e8fd','#e6f7f7']
  const borderPalette = ['#b7dfc6','#f2d4a8','#c7d7fe','#f5b8b1','#dec8fb','#bfe9e9']
  const getEventColor = (ev: EventItem) => {
    const key = ev.id ?? ev.title.length
    const idx = Math.abs(key) % palette.length
    return { bg: palette[idx], border: borderPalette[idx] }
  }

  return (
    <div>
      <div className="section">
        <h1 className="card-title" style={{ fontSize: '2rem', marginBottom: 12 }}>일정 관리</h1>
        <div className="card" style={{ padding: 16, display:'flex', alignItems:'center', gap:12, justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))}>‹</button>
            <strong style={{ fontSize:'1.2rem' }}>{ymLabel}</strong>
            <button onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))}>›</button>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className={"badge " + (category==='Laboratory' ? 'badge-green':'')} onClick={() => setCategory('Laboratory')}>Laboratory</button>
            <button className={"badge " + (category==='Personal' ? 'badge-amber':'')} onClick={() => setCategory('Personal')}>개인</button>
          </div>
        </div>
      </div>

      {/* 일정 등록 폼 */}
      <div className="section">
        <div className="card" style={{ padding: 24 }}>
          <h2 className="card-title" style={{ marginBottom: 16 }}>새 일정 등록</h2>
          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, color: 'var(--color-text)' }}>일정 제목</label>
              <input 
                placeholder="일정 제목을 입력하세요" 
                value={title} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: 12,
                  border: '1px solid var(--border-color)',
                  borderRadius: 6,
                  fontSize: '1rem',
                  fontFamily: 'inherit'
                }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, color: 'var(--color-text)' }}>카테고리</label>
              <select value={category} onChange={(e)=> setCategory(e.target.value as any)} style={{ width:'100%', padding:12, border:'1px solid var(--border-color)', borderRadius:6 }}>
                <option value="Laboratory">Laboratory</option>
                <option value="Personal">개인</option>
              </select>
            </div>
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, color: 'var(--color-text)' }}>시작 시간</label>
                <input 
                  type="datetime-local" 
                  value={startAt} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartAt(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '1px solid var(--border-color)',
                    borderRadius: 6,
                    fontSize: '1rem',
                    fontFamily: 'inherit'
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, color: 'var(--color-text)' }}>종료 시간</label>
                <input 
                  type="datetime-local" 
                  value={endAt} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndAt(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '1px solid var(--border-color)',
                    borderRadius: 6,
                    fontSize: '1rem',
                    fontFamily: 'inherit'
                  }}
                  required
                />
              </div>
            </div>
            <button 
              type="submit"
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
              일정 등록
            </button>
          </form>
        </div>
      </div>

      {/* 월간 캘린더 */}
      <div className="section">
        <div className="card" style={{ padding: 0, overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', borderTop:'1px solid var(--border-color)', borderLeft:'1px solid var(--border-color)' }}>
            {["일","월","화","수","목","금","토"].map((d) => (
              <div key={d} style={{ padding:10, textAlign:'center', fontWeight:900, background:'#fafafa', borderRight:'1px solid var(--border-color)', borderBottom:'1px solid var(--border-color)', color: d==='일' ? '#c62828' : d==='토' ? '#1565c0' : undefined }}>{d}</div>
            ))}
            {cells.map(({ date, inCurrent }, idx) => {
              const dayEvents = items.filter(ev => {
                const sd = new Date(ev.startAt)
                const ed = new Date(ev.endAt)
                // 이벤트가 해당 날짜에 걸쳐 있는지(시작~종료 범위)
                const inRange = sd <= date && date <= ed
                const evCat = (ev.category === '개인') ? 'Personal' : (ev.category || 'Laboratory')
                const catOk = !ev.category || evCat === category
                return inRange && catOk
              })
              const weekday = date.getDay()
              const dayColor = isHoliday(date) || weekday === 0 ? '#c62828' : (weekday === 6 ? '#1565c0' : undefined)
              return (
                <div key={idx} style={{ height:120, padding:8, borderRight:'1px solid var(--border-color)', borderBottom:'1px solid var(--border-color)', background: inCurrent ? '#fff' : '#fafafa' }}>
                  <div style={{ fontWeight:700, marginBottom:4, color: dayColor, opacity: inCurrent ? 1 : 0.6 }}>{date.getDate()}</div>
                  <div style={{ display:'grid', gap:6 }}>
                    {dayEvents.map(ev => {
                      const sd = new Date(ev.startAt)
                      const ed = new Date(ev.endAt)
                      const isStart = sd.getFullYear() === date.getFullYear() && sd.getMonth() === date.getMonth() && sd.getDate() === date.getDate()
                      const isEnd = ed.getFullYear() === date.getFullYear() && ed.getMonth() === date.getMonth() && ed.getDate() === date.getDate()
                      return (
                        <div key={ev.id} style={{ position:'relative', height:20 }}>
                          {(() => { const c = getEventColor(ev); return (
                          <div
                            onClick={() => setEditing(ev)}
                            title={ev.title}
                            style={{
                              position:'absolute', left: isStart ? 8 : 0, right: isEnd ? 8 : 0, top:0, bottom:0,
                              background: c.bg,
                              border:`1px solid ${c.border}`,
                              borderRadius:4,
                              overflow:'hidden',
                              cursor:'pointer',
                              display:'flex', alignItems:'center', padding:'0 6px',
                              fontSize:12, color:'#2a2a2a'
                            }}
                          >
                            <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ev.title}</span>
                          </div>
                          ) })()}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 빈 상태 카드 제거 */}
      </div>
      {/* 편집 모달 */}
      {editing && (
        <div className="card" style={{ position:'fixed', left:'50%', top:'20%', transform:'translateX(-50%)', zIndex:1000, padding:24, minWidth:360 }}>
          <h3 className="card-title" style={{ marginBottom:12 }}>일정 수정/삭제</h3>
          <div style={{ display:'grid', gap:12 }}>
            <input value={editing.title} onChange={(e)=> setEditing({ ...editing, title: e.target.value })} />
            <input type="datetime-local" value={new Date(editing.startAt).toISOString().slice(0,16)} onChange={(e)=> setEditing({ ...editing, startAt: new Date(e.target.value).toISOString() })} />
            <input type="datetime-local" value={new Date(editing.endAt).toISOString().slice(0,16)} onChange={(e)=> setEditing({ ...editing, endAt: new Date(e.target.value).toISOString() })} />
            <select value={editing.category || 'Laboratory'} onChange={(e)=> setEditing({ ...editing, category: e.target.value as any })}>
              <option value="Laboratory">Laboratory</option>
              <option value="Personal">개인</option>
            </select>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button onClick={async ()=> {
                try {
                  const body = { title: editing.title, startAt: editing.startAt, endAt: editing.endAt, category: editing.category }
                  await api.put(`/events/${editing.id}`, body, { headers: withUser() })
                  setEditing(undefined); await load(); setToast('일정이 저장되었습니다.')
                } catch (e: any) {
                  const msg = e?.response?.data?.message || '저장 실패'
                  setToast(msg)
                }
              }}>저장</button>
              <button onClick={async ()=> { 
                try { 
                  await api.delete(`/events/${editing.id}`, { headers: withUser() }); 
                  setEditing(undefined); await load(); setToast('삭제되었습니다.') 
                } catch(e: any){ 
                  const msg = e?.response?.data?.message || '삭제 실패'
                  setToast(msg) 
                } 
              }} style={{ background:'#dc3545' }}>삭제</button>
              <button onClick={()=> setEditing(undefined)} style={{ background:'#6c757d' }}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position:'fixed', left:'50%', bottom:20, transform:'translateX(-50%)', background:'#333', color:'#fff', padding:'10px 14px', borderRadius:8 }} onAnimationEnd={()=> setToast('')}>{toast}</div>
      )}
    </div>
  )
}

// 일정 작성/목록 화면입니다. 간단한 리스트 형태로 표시합니다.

