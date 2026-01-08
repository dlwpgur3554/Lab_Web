# .env 파일의 비밀번호로 DB 비밀번호 변경 스크립트 (PowerShell)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ".env 파일의 비밀번호로 DB 비밀번호 변경" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# .env 파일 확인
if (-not (Test-Path .env)) {
    Write-Host "❌ .env 파일을 찾을 수 없습니다!" -ForegroundColor Red
    exit 1
}

# .env 파일에서 비밀번호 읽기
$envContent = Get-Content .env
$newRootPwd = ($envContent | Select-String "^MYSQL_ROOT_PASSWORD=")
$newUserPwd = ($envContent | Select-String "^MYSQL_PASSWORD=")

if (-not $newRootPwd -or -not $newUserPwd) {
    Write-Host "❌ .env 파일에서 비밀번호를 찾을 수 없습니다!" -ForegroundColor Red
    Write-Host "   MYSQL_ROOT_PASSWORD와 MYSQL_PASSWORD가 설정되어 있는지 확인하세요." -ForegroundColor Yellow
    exit 1
}

$newRootPassword = $newRootPwd.ToString().Split('=')[1]
$newUserPassword = $newUserPwd.ToString().Split('=')[1]

Write-Host "✅ .env 파일에서 비밀번호 읽기 완료" -ForegroundColor Green
Write-Host "   Root 비밀번호: $($newRootPassword.Substring(0, [Math]::Min(20, $newRootPassword.Length)))..." -ForegroundColor White
Write-Host "   User 비밀번호: $($newUserPassword.Substring(0, [Math]::Min(20, $newUserPassword.Length)))..." -ForegroundColor White
Write-Host ""

# DB 컨테이너 확인
Write-Host "📋 DB 컨테이너 확인 중..." -ForegroundColor Yellow
$containerExists = docker ps -a --format '{{.Names}}' | Select-String -Pattern "^lab-mysql$"
if (-not $containerExists) {
    Write-Host "❌ lab-mysql 컨테이너를 찾을 수 없습니다!" -ForegroundColor Red
    exit 1
}

# 컨테이너가 실행 중인지 확인
$containerRunning = docker ps --format '{{.Names}}' | Select-String -Pattern "^lab-mysql$"
if (-not $containerRunning) {
    Write-Host "⚠️  DB 컨테이너가 실행되지 않았습니다. 시작 중..." -ForegroundColor Yellow
    docker start lab-mysql
    Write-Host "   DB 컨테이너 시작 대기 중 (30초)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
}

Write-Host "✅ DB 컨테이너 확인 완료" -ForegroundColor Green
Write-Host ""

# 기존 비밀번호로 접속 테스트
Write-Host "🔍 기존 비밀번호로 접속 시도 중..." -ForegroundColor Yellow

$oldPasswords = @("root", "lab", "CHANGE-THIS-IN-PRODUCTION")
$accessible = $false
$usedPassword = ""

foreach ($oldPwd in $oldPasswords) {
    $result = docker exec lab-mysql mysql -uroot -p"$oldPwd" -e "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        $accessible = $true
        $usedPassword = $oldPwd
        Write-Host "✅ 기존 비밀번호로 접속 성공: root/$oldPwd" -ForegroundColor Green
        break
    }
}

if (-not $accessible) {
    Write-Host "❌ 기존 비밀번호로 접속할 수 없습니다." -ForegroundColor Red
    Write-Host "   수동으로 비밀번호를 확인하고 변경하세요:" -ForegroundColor Yellow
    Write-Host "   docker exec -it lab-mysql mysql -uroot -p" -ForegroundColor White
    exit 1
}

Write-Host ""

# Root 비밀번호 변경
Write-Host "🔐 Root 비밀번호 변경 중..." -ForegroundColor Yellow
$rootSQL = @"
ALTER USER 'root'@'localhost' IDENTIFIED BY '$newRootPassword';
ALTER USER 'root'@'%' IDENTIFIED BY '$newRootPassword';
FLUSH PRIVILEGES;
"@

$rootSQL | docker exec -i lab-mysql mysql -uroot -p"$usedPassword" 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Root 비밀번호 변경 완료!" -ForegroundColor Green
} else {
    Write-Host "❌ Root 비밀번호 변경 실패!" -ForegroundColor Red
    exit 1
}

# Lab 사용자 비밀번호 변경
Write-Host "🔐 Lab 사용자 비밀번호 변경 중..." -ForegroundColor Yellow
$userSQL = @"
ALTER USER 'lab'@'%' IDENTIFIED BY '$newUserPassword';
FLUSH PRIVILEGES;
"@

$userSQL | docker exec -i lab-mysql mysql -uroot -p"$newRootPassword" 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Lab 사용자 비밀번호 변경 완료!" -ForegroundColor Green
} else {
    Write-Host "❌ Lab 사용자 비밀번호 변경 실패!" -ForegroundColor Red
    exit 1
}

# 새 비밀번호로 접속 테스트
Write-Host ""
Write-Host "🔍 새 비밀번호로 접속 테스트 중..." -ForegroundColor Yellow

$testRoot = docker exec lab-mysql mysql -uroot -p"$newRootPassword" -e "SELECT 1;" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Root 비밀번호 정상 작동 확인!" -ForegroundColor Green
} else {
    Write-Host "❌ Root 비밀번호 접속 실패!" -ForegroundColor Red
    exit 1
}

$testUser = docker exec lab-mysql mysql -ulab -p"$newUserPassword" -e "USE lab; SELECT 1;" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Lab 사용자 비밀번호 정상 작동 확인!" -ForegroundColor Green
} else {
    Write-Host "❌ Lab 사용자 비밀번호 접속 실패!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ 비밀번호 변경 완료!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Yellow
Write-Host "1. 백엔드 컨테이너 재시작:" -ForegroundColor White
Write-Host "   docker compose restart backend" -ForegroundColor Gray
Write-Host ""
Write-Host "2. 백엔드 로그 확인:" -ForegroundColor White
Write-Host "   docker logs -f labpageBE" -ForegroundColor Gray
Write-Host ""

