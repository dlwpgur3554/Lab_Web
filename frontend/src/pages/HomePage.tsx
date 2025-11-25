import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Link } from 'react-router-dom'

type LabInfo = {
  id: number
  labName: string
  description: string
  researchAreas: string
  facilities: string
  location: string
  contactEmail: string
  contactPhone: string
  director: { id: number; name: string; bio: string }
}

type Project = {
  id: number
  title: string
  description: string
  status: string
  leader: { id: number; name: string }
  createdAt: string
}

type Notice = {
  id: number
  title: string
  content: string
  author: { id: number; name: string }
  createdAt: string
}

export function HomePage() {
  const [labInfo, setLabInfo] = useState<LabInfo | null>(null)
  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  const [recentNews, setRecentNews] = useState<Notice[]>([])
  const [recentNotice, setRecentNotice] = useState<Notice[]>([])
  const slides = ['/slides/RM.jpg', '/slides/RM2.jpg']
  const [slideIdx, setSlideIdx] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [labInfoRes, projectsRes, newsRes, noticeRes] = await Promise.all([
          api.get<LabInfo>('/lab-info'),
          api.get('/projects'),
          api.get('/notices', { params: { category: 'NEWS' } }),
          api.get('/notices', { params: { category: 'NOTICE' } })
        ])

        setLabInfo(labInfoRes.data)
        const projectsData: any = projectsRes.data
        setRecentProjects((Array.isArray(projectsData) ? projectsData : projectsData?.content || []).slice(0, 3))
        const newsData: any = newsRes.data
        const noticeData: any = noticeRes.data
        const newsList = Array.isArray(newsData) ? newsData : (newsData?.content || [])
        const noticeList = Array.isArray(noticeData) ? noticeData : (noticeData?.content || [])
        setRecentNews(newsList.slice(0, 4))
        setRecentNotice(noticeList.slice(0, 4))
      } catch (error) {
        console.error('데이터 로딩 실패:', error)
      }
    }

    loadData()
  }, [])

  // hero slider auto-play
  useEffect(() => {
    const t = setInterval(() => {
      setSlideIdx((i) => (i + 1) % slides.length)
    }, 5000)
    return () => clearInterval(t)
  }, [slides.length])

  return (
    <div>
      {/* 히어로 슬라이드 */}
      <div className="hero slider">
        <div
          className="slides"
          style={{
            width: `${slides.length * 100}%`,
            transform: `translateX(-${slideIdx * (100 / slides.length)}%)`
          }}
        >
          {slides.map((src, i) => (
            <div key={i} className="slide" style={{ backgroundImage: `url(${src})` }} />
          ))}
        </div>
        <div className="hero-overlay">
          <h1>실감 멀티미디어 연구실</h1>
          <p>VR/AR·그래픽스·HCI 융합으로 현실에 가까운 몰입과 상호작용을 연구합니다.</p>
        </div>
        {slides.length > 1 && (
          <div className="dots">
            {slides.map((_, i) => (
              <button key={i} className={i === slideIdx ? 'on' : ''} onClick={() => setSlideIdx(i)} aria-label={`slide-${i+1}`} />
            ))}
          </div>
        )}
      </div>

      {/* 메인 블록: 좌측 공지사항 / 우측 연구실 소식 */}
      <div className="section">
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' as any }}>
          {/* Notice */}
          <div className="card" style={{ padding: 16 }}>
            <h3 className="card-title" style={{ marginBottom: 8 }}>공지사항</h3>
            <div className="list-card" style={{ border:'none', boxShadow:'none' }}>
              <ul>
                {recentNotice.slice(0, 4).map((n) => (
                  <li key={n.id}>
                    <Link to={`/notices/${n.id}`}>{n.title}</Link>
                    <span className="date">{new Date(n.createdAt).toLocaleDateString()}</span>
                  </li>
                ))}
                {recentNotice.length === 0 && (
                  <li><span style={{ color: 'var(--color-muted)' }}>등록된 항목이 없습니다.</span></li>
                )}
              </ul>
            </div>
          </div>

          {/* Laboratory News */}
          <div className="card" style={{ padding: 16 }}>
            <h3 className="card-title" style={{ marginBottom: 8 }}>연구실 소식</h3>
            <div className="list-card" style={{ border:'none', boxShadow:'none' }}>
              <ul>
                {recentNews.slice(0, 4).map((n) => (
                  <li key={n.id}>
                    <Link to={`/news/${n.id}`}>{n.title}</Link>
                    <span className="date">{new Date(n.createdAt).toLocaleDateString()}</span>
                  </li>
                ))}
                {recentNews.length === 0 && (
                  <li><span style={{ color: 'var(--color-muted)' }}>등록된 항목이 없습니다.</span></li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
