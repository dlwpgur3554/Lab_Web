import { useState, useEffect } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { NoticePage } from './pages/NoticePage'
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
import { AlumniManagePage } from './pages/AlumniManagePage'
import { AttendanceStatsPage } from './pages/AttendanceStatsPage'
import { ProtectedRoute } from './components/ProtectedRoute'

export function App() {
  // 로그인 상태를 state로 관리하여 localStorage 변경 시 UI 업데이트
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('lab_user'))

  // localStorage 변경 감지 및 로그인 상태 업데이트
  useEffect(() => {
    const checkLoginStatus = () => {
      setIsLoggedIn(!!localStorage.getItem('lab_user'))
    }

    // 초기 상태 확인
    checkLoginStatus()

    // storage 이벤트 리스너 (다른 탭에서의 변경 감지)
    window.addEventListener('storage', checkLoginStatus)

    // 커스텀 이벤트 리스너 (같은 탭에서의 변경 감지)
    window.addEventListener('lab-auth-change', checkLoginStatus)

    // 주기적으로 체크 (토큰 만료 시 자동 로그아웃 감지)
    const interval = setInterval(checkLoginStatus, 1000)

    return () => {
      window.removeEventListener('storage', checkLoginStatus)
      window.removeEventListener('lab-auth-change', checkLoginStatus)
      clearInterval(interval)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('lab_user')
    localStorage.removeItem('lab_token')
    setIsLoggedIn(false)
    window.location.reload()
  }

  return (
    <div className="site">
      {/* Topbar + Header Nav */}
      <div className="site-topbar">
        <div className="container site-topbar-inner">
          <Link to="/" className="topbar-brand" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img 
              src="/logo.png" 
              alt="Realistic Multimedia Lab" 
              style={{ height: '40px', objectFit: 'contain', maxWidth: '200px' }}
              onError={(e) => {
                // 로고 이미지가 없으면 텍스트로 대체
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent && !parent.querySelector('span.fallback-text')) {
                  const textSpan = document.createElement('span');
                  textSpan.className = 'fallback-text';
                  textSpan.textContent = 'Realistic Multimedia Lab';
                  textSpan.style.fontWeight = '900';
                  textSpan.style.color = '#222';
                  textSpan.style.fontSize = '18px';
                  parent.appendChild(textSpan);
                }
              }}
            />
          </Link>
          {isLoggedIn ? (
            <>
              <button onClick={handleLogout} style={{ background:'transparent', border:'none', cursor:'pointer', color:'#555', fontSize:16 }}>Logout</button>
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
            {isLoggedIn && <li><Link to="/notices">Notice</Link></li>}
            <li>
              <a href="#" onClick={(e)=> e.preventDefault()}>Members</a>
              <ul>
                <li><Link to="/members?type=current">Current</Link></li>
                <li><Link to="/members?type=alumni">Alumni</Link></li>
              </ul>
            </li>
            <li><Link to="/projects">Projects</Link></li>
            {isLoggedIn && <li><Link to="/resources">Resources</Link></li>}
            <li><Link to="/news">Laboratory News</Link></li>
            {isLoggedIn && <li><Link to="/attendance">Attendance</Link></li>}
          </ul>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/news" element={<LabNewsPage />} />
          <Route path="/news/:id" element={<LabNewsDetailPage />} />
          <Route path="/news/new" element={<ProtectedRoute><LabNewsNewPage /></ProtectedRoute>} />
          <Route path="/intro" element={<IntroductionPage />} />
          <Route path="/notices" element={<ProtectedRoute><NoticePage /></ProtectedRoute>} />
          <Route path="/notices/:id" element={<ProtectedRoute><NoticeDetailPage /></ProtectedRoute>} />
          <Route path="/notices/new" element={<ProtectedRoute><NoticeNewPage /></ProtectedRoute>} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/projects/new" element={<ProtectedRoute><ProjectNewPage /></ProtectedRoute>} />
          <Route path="/resources" element={<ProtectedRoute><ResourcesPage /></ProtectedRoute>} />
          <Route path="/resources/:id" element={<ProtectedRoute><ResourceDetailPage /></ProtectedRoute>} />
          <Route path="/resources/new" element={<ProtectedRoute><ResourcesNewPage /></ProtectedRoute>} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/members/manage" element={<MemberManagePage />} />
          <Route path="/members/manage/alumni" element={<AlumniManagePage />} />
          <Route path="/professor" element={<ProfessorPage />} />
          <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
          <Route path="/attendance/stats" element={<ProtectedRoute><AttendanceStatsPage /></ProtectedRoute>} />
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

