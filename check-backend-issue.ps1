# 백엔드 종료 문제 진단 스크립트

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "백엔드 종료 문제 진단" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 컨테이너 상태 확인
Write-Host "1. 컨테이너 상태 확인:" -ForegroundColor Yellow
Write-Host "   docker ps -a --filter 'name=labpageBE'" -ForegroundColor White
Write-Host ""

# 2. 로그 확인
Write-Host "2. 백엔드 로그 확인 (최근 50줄):" -ForegroundColor Yellow
Write-Host "   docker logs --tail 50 labpageBE" -ForegroundColor White
Write-Host ""

# 3. DB 연결 확인
Write-Host "3. DB 컨테이너 상태 확인:" -ForegroundColor Yellow
Write-Host "   docker ps -a --filter 'name=lab-mysql'" -ForegroundColor White
Write-Host ""

# 4. 환경 변수 확인
Write-Host "4. 환경 변수 확인:" -ForegroundColor Yellow
if (Test-Path .env) {
    Write-Host "   ✅ .env 파일 존재" -ForegroundColor Green
    $envContent = Get-Content .env
    $dbPwd = ($envContent | Select-String "^DB_PASSWORD=")
    $jwtSecret = ($envContent | Select-String "^JWT_SECRET=")
    
    if ($dbPwd) {
        Write-Host "   ✅ DB_PASSWORD 설정됨" -ForegroundColor Green
    } else {
        Write-Host "   ❌ DB_PASSWORD 없음" -ForegroundColor Red
    }
    
    if ($jwtSecret) {
        Write-Host "   ✅ JWT_SECRET 설정됨" -ForegroundColor Green
    } else {
        Write-Host "   ❌ JWT_SECRET 없음" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ .env 파일 없음" -ForegroundColor Red
}

Write-Host ""
Write-Host "5. docker-compose.yml 환경 변수 확인:" -ForegroundColor Yellow
if (Test-Path docker-compose.yml) {
    $composeContent = Get-Content docker-compose.yml
    $dbPassword = $composeContent | Select-String "DB_PASSWORD:"
    if ($dbPassword) {
        Write-Host "   $dbPassword" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "일반적인 원인 및 해결 방법" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. DB 연결 실패 (가장 흔함)" -ForegroundColor Yellow
Write-Host "   - DB 비밀번호가 변경되었는데 .env 파일과 다를 수 있음" -ForegroundColor White
Write-Host "   - 해결: DB 비밀번호 변경 후 .env 파일 업데이트" -ForegroundColor Green
Write-Host ""
Write-Host "2. DB 컨테이너가 준비되지 않음" -ForegroundColor Yellow
Write-Host "   - MySQL이 아직 시작 중일 수 있음" -ForegroundColor White
Write-Host "   - 해결: docker compose restart db 후 대기" -ForegroundColor Green
Write-Host ""
Write-Host "3. 환경 변수 누락" -ForegroundColor Yellow
Write-Host "   - JWT_SECRET 또는 DB_PASSWORD가 없음" -ForegroundColor White
Write-Host "   - 해결: .env 파일 확인 및 생성" -ForegroundColor Green
Write-Host ""
Write-Host "4. 포트 충돌" -ForegroundColor Yellow
Write-Host "   - 포트 5000이 이미 사용 중" -ForegroundColor White
Write-Host "   - 해결: docker compose down 후 재시작" -ForegroundColor Green
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "로그 확인 명령어 (서버에서 실행):" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "# 전체 로그" -ForegroundColor White
Write-Host "docker logs labpageBE" -ForegroundColor Gray
Write-Host ""
Write-Host "# 최근 100줄" -ForegroundColor White
Write-Host "docker logs --tail 100 labpageBE" -ForegroundColor Gray
Write-Host ""
Write-Host "# 실시간 로그 (재시작 후)" -ForegroundColor White
Write-Host "docker logs -f labpageBE" -ForegroundColor Gray
Write-Host ""

