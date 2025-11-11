Write-Host "=== Backend Migration Script ===" -ForegroundColor Cyan
Write-Host ""

$errorOccurred = $false

Write-Host "Step 1: Checking for running Node processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "WARNING: Node.js processes are running!" -ForegroundColor Red
    Write-Host "The migration might fail if the server is using the database." -ForegroundColor Yellow
    Write-Host "Please stop the backend server (Ctrl+C in the terminal where it's running) and press Enter to continue..." -ForegroundColor Yellow
    Read-Host
} else {
    Write-Host "No Node.js processes found. Safe to proceed." -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 2: Generating Prisma Client..." -ForegroundColor Yellow
try {
    npx prisma generate
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Prisma Client generated successfully!" -ForegroundColor Green
    } else {
        Write-Host "Error generating Prisma Client. Please stop the backend server and try again." -ForegroundColor Red
        $errorOccurred = $true
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    $errorOccurred = $true
}

if (-not $errorOccurred) {
    Write-Host ""
    Write-Host "Step 3: Applying database migrations..." -ForegroundColor Yellow
    try {
        npx prisma db push --accept-data-loss
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Database migrations applied successfully!" -ForegroundColor Green
        } else {
            Write-Host "Error applying migrations. Database might be locked." -ForegroundColor Red
            Write-Host "Please ensure the backend server is stopped and try again." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Migration Process Complete ===" -ForegroundColor Cyan
Write-Host "You can now start the backend server with: npm run dev" -ForegroundColor Green

