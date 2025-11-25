# 실감 멀티미디어 연구실 웹사이트

연구실 운영에 필요한 공지/자료/프로젝트/구성원/출퇴근을 한 곳에서 관리하는 경량 웹 애플리케이션입니다. 프론트엔드는 React + Vite, 백엔드는 Spring Boot + JPA를 사용합니다.

## 🚀 주요 기능

### 🧭 글로벌 UI/스타일
- 헤더/푸터 컬러: `#3a4978`
- 상단 네비 Lab 드롭다운(Introduction/Professor)
- 모든 페이지네이션 버튼 커서·비활성화 스타일 통일

### 📢 공지/자료(Notice/Resources)
- 공지 작성/수정/삭제(작성자 또는 관리자)
- 첨부파일 업로드/다운로드(파일키 기반, `Content-Disposition`으로 파일명 보존)
- 상단 고정(핀) 기능: 목록 상단 고정/해제, 번호 대신 `-` 표기

### 📰 연구실 소식(News)
- 이미지 기반 등록/편집(일반 첨부 미사용)
- 편집 시 이미지 반투명 표시 → 저장 시 일괄 삭제 반영

### 🔬 프로젝트(Projects)
- 상태: 계획/진행중/완료, 인원 텍스트, 한줄소개(summary)
- 작성자만 수정/삭제(프론트/백 둘 다 검사)
- 상세: 작성자/작성일, 상태/인원, 한줄소개, 내용, 이미지/첨부 분리 표시

### 👥 구성원(Member)
- 역할(Role): `NONE(-) | PROFESSOR | MEMBER | ALUMNI`
- 관리자 권한(Admin): 역할과 분리된 불리언(어떤 역할이라도 관리자 가능)
- 정렬 관리: 드래그(▲/▼) + "순서 저장"(sortOrder)
- 멤버 관리 UI: 역할·관리자 분리, 관리자 체크는 별도 열에서 수행

### ⏰ 출퇴근(Attendance)
- 당일 출근/퇴근 1회 기록, 자정(23:59:59) 자동 퇴근 처리
- 관리자 전용 통계 페이지
  - 오늘 상태 표(이름/출근/퇴근)
  - 월별 현황 매트릭스(역할이 `MEMBER`인 전원 표시)
  - 일요일/공휴일 붉은색, 토요일 파란색 하이라이트
  - 우측 "월별 평균" 패널(평균 출근/퇴근 HH:mm)
  - 이전달/다음달 전환

## 🛠 기술 스택

### Backend
- Java 17, Spring Boot 3.3.x, Spring Data JPA, MySQL, Lombok, SpringDoc(OpenAPI)

### Frontend
- React 18, TypeScript, Vite, React Router, Axios

## 📦 로컬 실행(개발)

### 요구사항
- Java 17+, Node.js 22+, MySQL 8+

### 백엔드
```bash
cd backend
mvn clean spring-boot:run
```
기본 포트: `http://localhost:8080`

### 프론트엔드
```bash
cd frontend
npm install
npm run dev
```
기본 포트: `http://localhost:5173`

## 🔧 환경 설정

### backend/src/main/resources/application.yml
```yaml
spring:
  datasource:
    url: jdbc:mysql://${DB_HOST:localhost}:${DB_PORT:3306}/${DB_NAME:lab}?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
    username: ${DB_USER:lab}
    password: ${DB_PASSWORD:lab}
  jpa:
    hibernate:
      ddl-auto: update
  servlet:
    multipart:
      max-file-size: 20MB
      max-request-size: 40MB
server:
  port: ${PORT:8080}
```

### 프론트엔드(.env)
```bash
VITE_API_BASE_URL=http://localhost:8080
```
또는 Nginx 리버스 프록시에서 `/api`를 백엔드로 프록시하면 별도 설정 없이 동작합니다.

## 🔐 인증/권한
- 간단한 헤더 기반 인증: `X-USER`(loginId/name/email 중 하나)
- 미로그인/식별 불가: "로그인 후 이용해주세요." 메시지 반환
- 권한: 관리자(`admin=true`)이면 대부분의 보호 작업 허용, 그 외는 작성자만

## 📄 API 문서
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`

## 🐳 도커 배포(요약)

### Backend Dockerfile
```Dockerfile
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY target/realistic-multimedia-lab-0.0.1-SNAPSHOT.jar app.jar
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["sh","-c","java -jar app.jar"]
```
```bash
cd backend
mvn -DskipTests package
docker build -t lab-backend:latest .
docker run -d --name lab-backend -p 8080:8080 \
  -e DB_HOST=... -e DB_USER=... -e DB_PASSWORD=... \
  -v $(pwd)/uploads:/app/uploads lab-backend:latest
```

### Frontend(Nginx) Dockerfile
```Dockerfile
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```
`nginx.conf`
```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;
  location / { try_files $uri $uri/ /index.html; }
  location /api/ { proxy_pass http://BACKEND_HOST:8080/; }
}
```
```bash
cd frontend
npm ci && npm run build
docker build -t lab-frontend:latest .
docker run -d --name lab-frontend -p 80:80 lab-frontend:latest
```

## 📝 비고
- 파일 다운로드는 `fileKey` 기반 안전 URL로 처리합니다.
- 이미지 삽입은 마크다운 `![image](url)`을 사용해 상세에서 바로 보이도록 합니다.
- 프로젝트/뉴스 편집에서 반투명 표시 후 저장 시 일괄 삭제 반영합니다.

## 📞 문의
- 실감 멀티미디어 연구실
- 이메일: ksshin@knu.ac.kr

