# 빠른 비밀번호 변경 스크립트
# .env 파일의 비밀번호로 기존 DB 비밀번호를 변경합니다

$envContent = Get-Content .env
$newRootPwd = ($envContent | Select-String "^MYSQL_ROOT_PASSWORD=").ToString().Split('=')[1]
$newUserPwd = ($envContent | Select-String "^MYSQL_PASSWORD=").ToString().Split('=')[1]

Write-Host "Root 비밀번호 변경 중..." -ForegroundColor Yellow
$rootSQL = "ALTER USER 'root'@'localhost' IDENTIFIED BY '$newRootPwd'; ALTER USER 'root'@'%' IDENTIFIED BY '$newRootPwd'; FLUSH PRIVILEGES;"
echo $rootSQL | docker exec -i lab-mysql mysql -uroot -proot

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Root 비밀번호 변경 완료!" -ForegroundColor Green
    
    Write-Host "Lab 사용자 비밀번호 변경 중..." -ForegroundColor Yellow
    $userSQL = "ALTER USER 'lab'@'%' IDENTIFIED BY '$newUserPwd'; FLUSH PRIVILEGES;"
    echo $userSQL | docker exec -i lab-mysql mysql -uroot -p"$newRootPwd"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Lab 사용자 비밀번호 변경 완료!" -ForegroundColor Green
        Write-Host ""
        Write-Host "다음 명령으로 백엔드를 재시작하세요:" -ForegroundColor Yellow
        Write-Host "docker compose restart backend" -ForegroundColor White
    } else {
        Write-Host "❌ Lab 사용자 비밀번호 변경 실패!" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Root 비밀번호 변경 실패! DB 컨테이너가 실행 중인지 확인하세요." -ForegroundColor Red
}

