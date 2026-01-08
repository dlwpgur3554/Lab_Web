# JWT 시크릿 키 생성 스크립트 (PowerShell)

Write-Host "=== .NET을 사용한 JWT 시크릿 키 생성 ===" -ForegroundColor Green

# 방법 1: Base64 인코딩된 랜덤 바이트
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$base64 = [Convert]::ToBase64String($bytes)
Write-Host "Base64 (권장): $base64" -ForegroundColor Yellow

# 방법 2: 16진수 문자열
$hex = [BitConverter]::ToString($bytes).Replace("-", "").ToLower()
Write-Host "Hex: $hex" -ForegroundColor Yellow

Write-Host "`n=== 사용 방법 ===" -ForegroundColor Green
Write-Host "1. 위에서 생성된 키를 복사하세요"
Write-Host "2. docker-compose.yml의 backend 서비스에 환경 변수로 추가하세요:"
Write-Host "   JWT_SECRET: '생성된-키-여기에-붙여넣기'"
Write-Host "3. 또는 서버의 .env 파일에 추가하세요"

