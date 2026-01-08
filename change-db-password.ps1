# 기존 데이터를 유지하면서 MySQL 비밀번호만 변경하는 PowerShell 스크립트

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "MySQL 비밀번호 변경 스크립트" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# .env 파일에서 새 비밀번호 읽기
if (-not (Test-Path .env)) {
    Write-Host "❌ .env 파일을 찾을 수 없습니다!" -ForegroundColor Red
    exit 1
}

# .env 파일에서 비밀번호 추출
$envContent = Get-Content .env
$newRootPassword = ($envContent | Select-String "^MYSQL_ROOT_PASSWORD=").ToString().Split('=')[1]
$newUserPassword = ($envContent | Select-String "^MYSQL_PASSWORD=").ToString().Split('=')[1]

if ([string]::IsNullOrEmpty($newRootPassword) -or [string]::IsNullOrEmpty($newUserPassword)) {
    Write-Host "❌ .env 파일에서 비밀번호를 찾을 수 없습니다!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 새 Root 비밀번호: $($newRootPassword.Substring(0, [Math]::Min(10, $newRootPassword.Length)))..." -ForegroundColor Green
Write-Host "✅ 새 User 비밀번호: $($newUserPassword.Substring(0, [Math]::Min(10, $newUserPassword.Length)))..." -ForegroundColor Green
Write-Host ""

# 기존 비밀번호로 접속 테스트
Write-Host "📋 기존 DB에 접속 중..." -ForegroundColor Yellow
$testResult = docker exec lab-mysql mysql -uroot -proot -e "SELECT 1;" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 기존 비밀번호(root/root)로 접속할 수 없습니다." -ForegroundColor Red
    Write-Host "   DB 컨테이너가 실행 중인지 확인하세요: docker ps" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ 기존 DB 접속 성공!" -ForegroundColor Green
Write-Host ""

# Root 비밀번호 변경
Write-Host "🔐 Root 비밀번호 변경 중..." -ForegroundColor Yellow
$rootChangeSQL = @"
ALTER USER 'root'@'localhost' IDENTIFIED BY '$newRootPassword';
ALTER USER 'root'@'%' IDENTIFIED BY '$newRootPassword';
FLUSH PRIVILEGES;
"@

$rootChangeSQL | docker exec -i lab-mysql mysql -uroot -proot

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Root 비밀번호 변경 완료!" -ForegroundColor Green
} else {
    Write-Host "❌ Root 비밀번호 변경 실패!" -ForegroundColor Red
    exit 1
}

# Lab 사용자 비밀번호 변경
Write-Host "🔐 Lab 사용자 비밀번호 변경 중..." -ForegroundColor Yellow
$userChangeSQL = @"
ALTER USER 'lab'@'%' IDENTIFIED BY '$newUserPassword';
FLUSH PRIVILEGES;
"@

$userChangeSQL | docker exec -i lab-mysql mysql -uroot -p"$newRootPassword"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Lab 사용자 비밀번호 변경 완료!" -ForegroundColor Green
} else {
    Write-Host "❌ Lab 사용자 비밀번호 변경 실패!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ 비밀번호 변경 완료!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Yellow
Write-Host "1. docker-compose.yml이 .env 파일을 읽도록 설정되어 있는지 확인" -ForegroundColor White
Write-Host "2. 백엔드 컨테이너 재시작: docker compose restart backend" -ForegroundColor White
Write-Host "3. 새 비밀번호로 접속 테스트:" -ForegroundColor White
Write-Host "   docker exec -it lab-mysql mysql -uroot -p" -ForegroundColor White
Write-Host ""

