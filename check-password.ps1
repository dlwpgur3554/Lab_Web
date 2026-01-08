# 비밀번호 확인 스크립트

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "비밀번호 확인" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# .env 파일 확인
if (Test-Path .env) {
    Write-Host "📄 .env 파일의 비밀번호:" -ForegroundColor Yellow
    $envContent = Get-Content .env
    $rootPwd = ($envContent | Select-String "^MYSQL_ROOT_PASSWORD=")
    $userPwd = ($envContent | Select-String "^MYSQL_PASSWORD=")
    $jwtSecret = ($envContent | Select-String "^JWT_SECRET=")
    
    if ($rootPwd) {
        $rootValue = $rootPwd.ToString().Split('=')[1]
        Write-Host "  Root 비밀번호: $($rootValue.Substring(0, [Math]::Min(20, $rootValue.Length)))..." -ForegroundColor White
        Write-Host "    전체: $rootValue" -ForegroundColor Gray
    }
    if ($userPwd) {
        $userValue = $userPwd.ToString().Split('=')[1]
        Write-Host "  User 비밀번호: $($userValue.Substring(0, [Math]::Min(20, $userValue.Length)))..." -ForegroundColor White
        Write-Host "    전체: $userValue" -ForegroundColor Gray
    }
    if ($jwtSecret) {
        $jwtValue = $jwtSecret.ToString().Split('=')[1]
        Write-Host "  JWT Secret: $($jwtValue.Substring(0, [Math]::Min(20, $jwtValue.Length)))..." -ForegroundColor White
        Write-Host "    전체: $jwtValue" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ .env 파일이 없습니다!" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔍 MySQL 접속 테스트 (원격 서버: 172.21.166.238:3306):" -ForegroundColor Yellow

# MySQL 클라이언트 확인
$mysqlCmd = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysqlCmd) {
    Write-Host "  ⚠️  MySQL 클라이언트가 설치되어 있지 않습니다." -ForegroundColor Yellow
    Write-Host "     서버에서 직접 확인하세요:" -ForegroundColor White
    Write-Host "     docker exec -it lab-mysql mysql -uroot -p" -ForegroundColor Gray
} else {
    if ($rootPwd) {
        $rootValue = $rootPwd.ToString().Split('=')[1]
        Write-Host "  Root 비밀번호 테스트 중..." -ForegroundColor Yellow
        $result = mysql -h 172.21.166.238 -P 3306 -u root -p"$rootValue" -e "SELECT 1;" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ✅ Root 비밀번호 정상! 접속 성공" -ForegroundColor Green
        } else {
            Write-Host "    ❌ Root 비밀번호 오류! 접속 실패" -ForegroundColor Red
            Write-Host "    오류: $result" -ForegroundColor Red
        }
    }
    
    if ($userPwd) {
        $userValue = $userPwd.ToString().Split('=')[1]
        Write-Host "  Lab 사용자 비밀번호 테스트 중..." -ForegroundColor Yellow
        $result = mysql -h 172.21.166.238 -P 3306 -u lab -p"$userValue" -e "USE lab; SELECT 1;" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ✅ Lab 사용자 비밀번호 정상! 접속 성공" -ForegroundColor Green
        } else {
            Write-Host "    ❌ Lab 사용자 비밀번호 오류! 접속 실패" -ForegroundColor Red
            Write-Host "    오류: $result" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "📋 docker-compose.yml의 환경 변수 설정:" -ForegroundColor Yellow
if (Test-Path docker-compose.yml) {
    $composeContent = Get-Content docker-compose.yml
    $dbPassword = $composeContent | Select-String "DB_PASSWORD:"
    $jwtSecret = $composeContent | Select-String "JWT_SECRET:"
    
    if ($dbPassword) {
        Write-Host "  $dbPassword" -ForegroundColor White
    }
    if ($jwtSecret) {
        Write-Host "  $jwtSecret" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "💡 팁:" -ForegroundColor Cyan
Write-Host "  - .env 파일의 비밀번호를 보려면: Get-Content .env" -ForegroundColor Gray
Write-Host "  - MySQL에 직접 접속하려면: mysql -h 172.21.166.238 -P 3306 -u root -p" -ForegroundColor Gray
Write-Host "  - 서버에서 확인: docker exec -it lab-mysql mysql -uroot -p" -ForegroundColor Gray

