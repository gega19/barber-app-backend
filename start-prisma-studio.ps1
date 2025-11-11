$ErrorActionPreference = 'Continue'
cd 'C:\Users\Gabriel\Desktop\projects\barber_app\backend'
Write-Host ''
Write-Host '========================================' -ForegroundColor Green
Write-Host '   PRISMA STUDIO - BASE DE DATOS' -ForegroundColor Green  
Write-Host '========================================' -ForegroundColor Green
Write-Host ''
Write-Host 'Esta ventana muestra Prisma Studio' -ForegroundColor Cyan
Write-Host 'NO la cierres mientras trabajas' -ForegroundColor Yellow
Write-Host ''
Write-Host 'Iniciando Prisma Studio en puerto 5558...' -ForegroundColor Cyan
Write-Host ''
npx --yes prisma studio --port 5558 --browser none
Write-Host ''
Write-Host 'Prisma Studio se detuvo.' -ForegroundColor Red
pause
