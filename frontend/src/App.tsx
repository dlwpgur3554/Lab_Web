import { Link, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { NoticePage } from './pages/NoticePage'
import { CalendarPage } from './pages/CalendarPage'
import { AttendancePage } from './pages/AttendancePage'
import { ProjectsPage } from './pages/ProjectsPage'
import { MembersPage } from './pages/MembersPage'
import { ResourcesPage } from './pages/ResourcesPage'
import { ProfilePage } from './pages/ProfilePage'
import { IntroductionPage } from './pages/IntroductionPage'
import { ProfessorPage } from './pages/ProfessorPage'
import { LabNewsPage } from './pages/LabNewsPage'
import { LoginPage } from './pages/LoginPage'
import { withUser } from './lib/api'
import { NoticeNewPage } from './pages/NoticeNewPage'
import { ProjectNewPage } from './pages/ProjectNewPage'
import { LabNewsNewPage } from './pages/LabNewsNewPage'
import { ResourcesNewPage } from './pages/ResourcesNewPage'
import { NoticeDetailPage } from './pages/NoticeDetailPage'
import { LabNewsDetailPage } from './pages/LabNewsDetailPage'
import { ResourceDetailPage } from './pages/ResourceDetailPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { MemberManagePage } from './pages/MemberManagePage'
import { AttendanceStatsPage } from './pages/AttendanceStatsPage'

export function App() {
  return (
    <div className="site">
      {/* Topbar + Header Nav */}
      <div className="site-topbar">
        <div className="container site-topbar-inner">
          <span className="topbar-brand">Realistic Multimedia Lab</span>
          <Link to="/"><span className="home-badge">Home</span></Link>
          {localStorage.getItem('lab_user') ? (
            <>
              <button onClick={()=> { localStorage.removeItem('lab_user'); window.location.reload(); }} style={{ background:'transparent', border:'none', cursor:'pointer', color:'#555', fontSize:16 }}>Logout</button>
              <Link to="/profile">Profile</Link>
            </>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      </div>
      <header className="site-header">
        <div className="container site-header-inner">
          <ul className="mega-nav">
            <li>
              <a href="#" onClick={(e)=> e.preventDefault()}>Lab</a>
              <ul>
                <li><Link to="/intro">Introduction</Link></li>
                <li><Link to="/professor">Professor</Link></li>
              </ul>
            </li>
            <li><Link to="/notices">Notice</Link></li>
            <li>
              <a href="#" onClick={(e)=> e.preventDefault()}>Members</a>
              <ul>
                <li><Link to="/members?type=current">Current</Link></li>
                <li><Link to="/members?type=alumni">Alumni</Link></li>
              </ul>
            </li>
            <li><Link to="/projects">Projects</Link></li>
            <li>
              <Link to="/resources">Resources</Link>
              <ul>
                <li><Link to="/resources">Resources</Link></li>
                <li><Link to="/news">Laboratory News</Link></li>
              </ul>
            </li>
            <li><Link to="/calendar">Calendar</Link></li>
            <li><Link to="/attendance">Attendance</Link></li>
          </ul>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/news" element={<LabNewsPage />} />
          <Route path="/news/:id" element={<LabNewsDetailPage />} />
          <Route path="/news/new" element={<LabNewsNewPage />} />
          <Route path="/intro" element={<IntroductionPage />} />
          <Route path="/notices" element={<NoticePage />} />
          <Route path="/notices/:id" element={<NoticeDetailPage />} />
          <Route path="/notices/new" element={<NoticeNewPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/projects/new" element={<ProjectNewPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/resources/:id" element={<ResourceDetailPage />} />
          <Route path="/resources/new" element={<ResourcesNewPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/members/manage" element={<MemberManagePage />} />
          <Route path="/professor" element={<ProfessorPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/attendance/stats" element={<AttendanceStatsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </main>

      {/* 푸터 */}
      <footer className="site-footer">
        <div className="inner container">
          <h3>실감 멀티미디어 연구실</h3>
          <p style={{ marginBottom: 20, opacity: 0.9 }}>
            VR/AR, 컴퓨터 그래픽스, 실시간 렌더링 등의 분야를 연구하는 연구실입니다.
          </p>
          <div className="meta">
            <div>국립순천대학교 공과대학 3호관 403호</div>
            <div>waver@scnu.ac.kr</div>
            <div>061-750-3623</div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// 기본 라우팅과 헤더 네비게이션을 제공합니다.

