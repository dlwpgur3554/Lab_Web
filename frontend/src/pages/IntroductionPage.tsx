export function IntroductionPage() {
  return (
    <div className="container">
      <div className="section">
        <h1 className="card-title" style={{ fontSize: '2rem', marginBottom: 0 }}>연구실 소개</h1>
      </div>
      <div className="section">
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display:'grid', gap: 18 }}>
            <p style={{ lineHeight: 1.9, color: 'var(--color-text)', margin: 0 }}>
              컴퓨터공학에서의 <strong>실감 멀티미디어(Realistic Multimedia)</strong>는 사용자의 감각적 몰입과 상호작용을 극대화하기 위해
              <strong>가상현실(VR)</strong>, <strong>증강현실(AR)</strong>, <strong>혼합현실(MR)</strong>과 같은 첨단 기술을 연구·개발하는 분야입니다.
              이 분야는 컴퓨터 그래픽스, 컴퓨터 비전, 인터페이스 디자인, 인공지능, 인간-컴퓨터 상호작용(HCI) 등 다양한 학문을 융합하여
              현실에 근접한 경험을 설계하고 구현함으로써, 새로운 형태의 사용자 가치를 창출합니다.
            </p>

            <div className="list-card" style={{ border:'none', boxShadow:'none' }}>
              <div style={{ padding: 0 }}>
                <h2 className="card-title" style={{ margin: '8px 0 6px 0', fontSize: '1.2rem' }}>주요 연구/프로젝트 영역</h2>
              </div>
              <ul style={{ padding: 0, margin: 0 }}>
                <li style={{ borderBottom:'none', padding: '8px 0' }}>• 사용자 경험(UX) 및 인터랙션 디자인 연구</li>
                <li style={{ borderBottom:'none', padding: '8px 0' }}>• 의료 분야를 위한 실감 현실 기반 치료·진단 도구 연구 및 개발</li>
                <li style={{ borderBottom:'none', padding: '8px 0' }}>• 교육·훈련용 가상 현실 시뮬레이터 연구</li>
                <li style={{ borderBottom:'none', padding: '8px 0' }}>• 다양한 산업 분야에 적용 가능한 실감 멀티미디어 핵심 기술 연구</li>
              </ul>
            </div>

            <div style={{ background:'#f8f9fb', border:'1px solid #eef1f4', borderRadius: 10, padding: 16 }}>
              <p style={{ margin: 0, lineHeight: 1.8, color:'#2a2a2a' }}>
                우리 연구실은 학제 간 협업을 바탕으로 실험·프로토타입·현장 검증을 반복하며,
                기술이 실제 사용자와 산업 현장에서 <strong>가치로 연결</strong>될 수 있도록 연구를 수행합니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


