# 원격 DB 서버(172.21.166.238:3306) 비밀번호 변경 스크립트

$DB_HOST = "172.21.166.238"
$DB_PORT = "3306"
$OLD_ROOT_PASSWORD = "root"
$OLD_USER_PASSWORD = "lab"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "원격 DB 서버 비밀번호 변경" -ForegroundColor Cyan
Write-Host "서버: $DB_HOST:$DB_PORT" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# .env 파일에서 새 비밀번호 읽기
if (-not (Test-Path .env)) {
    Write-Host "❌ .env 파일을 찾을 수 없습니다!" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content .env
$newRootPwd = ($envContent | Select-String "^MYSQL_ROOT_PASSWORD=").ToString().Split('=')[1]
$newUserPwd = ($envContent | Select-String "^MYSQL_PASSWORD=").ToString().Split('=')[1]

if ([string]::IsNullOrEmpty($newRootPwd) -or [string]::IsNullOrEmpty($newUserPwd)) {
    Write-Host "❌ .env 파일에서 비밀번호를 찾을 수 없습니다!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 새 Root 비밀번호: $($newRootPwd.Substring(0, [Math]::Min(10, $newRootPwd.Length)))..." -ForegroundColor Green
Write-Host "✅ 새 User 비밀번호: $($newUserPwd.Substring(0, [Math]::Min(10, $newUserPwd.Length)))..." -ForegroundColor Green
Write-Host ""

# MySQL 클라이언트 확인
$mysqlCmd = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysqlCmd) {
    Write-Host "❌ MySQL 클라이언트가 설치되어 있지 않습니다!" -ForegroundColor Red
    Write-Host "   MySQL을 설치하거나 서버에서 직접 실행하세요." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "서버에서 실행할 명령어:" -ForegroundColor Yellow
    Write-Host "  docker exec -it lab-mysql mysql -uroot -proot" -ForegroundColor White
    Write-Host "  ALTER USER 'root'@'localhost' IDENTIFIED BY '$newRootPwd';" -ForegroundColor White
    Write-Host "  ALTER USER 'root'@'%' IDENTIFIED BY '$newRootPwd';" -ForegroundColor White
    Write-Host "  ALTER USER 'lab'@'%' IDENTIFIED BY '$newUserPwd';" -ForegroundColor White
    Write-Host "  FLUSH PRIVILEGES;" -ForegroundColor White
    exit 1
}

# 기존 비밀번호로 접속 테스트
Write-Host "📋 기존 DB에 접속 중..." -ForegroundColor Yellow
$testResult = mysql -h $DB_HOST -P $DB_PORT -u root -p"$OLD_ROOT_PASSWORD" -e "SELECT 1;" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 기존 비밀번호로 접속할 수 없습니다." -ForegroundColor Red
    Write-Host "   서버가 실행 중인지, 방화벽이 열려있는지 확인하세요." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ 기존 DB 접속 성공!" -ForegroundColor Green
Write-Host ""

# Root 비밀번호 변경
Write-Host "🔐 Root 비밀번호 변경 중..." -ForegroundColor Yellow
$rootSQL = "ALTER USER 'root'@'localhost' IDENTIFIED BY '$newRootPwd'; ALTER USER 'root'@'%' IDENTIFIED BY '$newRootPwd'; FLUSH PRIVILEGES;"
mysql -h $DB_HOST -P $DB_PORT -u root -p"$OLD_ROOT_PASSWORD" -e $rootSQL 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Root 비밀번호 변경 완료!" -ForegroundColor Green
    
    # Lab 사용자 비밀번호 변경
    Write-Host "🔐 Lab 사용자 비밀번호 변경 중..." -ForegroundColor Yellow
    $userSQL = "ALTER USER 'lab'@'%' IDENTIFIED BY '$newUserPwd'; FLUSH PRIVILEGES;"
    mysql -h $DB_HOST -P $DB_PORT -u root -p"$newRootPwd" -e $userSQL 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Lab 사용자 비밀번호 변경 완료!" -ForegroundColor Green
        Write-Host ""
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host "✅ 비밀번호 변경 완료!" -ForegroundColor Green
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "다음 단계:" -ForegroundColor Yellow
        Write-Host "1. 백엔드 컨테이너 재시작: docker compose restart backend" -ForegroundColor White
        Write-Host "2. 새 비밀번호로 접속 테스트:" -ForegroundColor White
        Write-Host "   mysql -h $DB_HOST -P $DB_PORT -u root -p" -ForegroundColor White
    } else {
        Write-Host "❌ Lab 사용자 비밀번호 변경 실패!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Root 비밀번호 변경 실패!" -ForegroundColor Red
    exit 1
}

