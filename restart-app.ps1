# Kill any existing Node.js processes
Write-Host "Stopping existing Node.js processes..."
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Wait a moment for processes to fully terminate
Start-Sleep -Seconds 2

# Clear Next.js cache
Write-Host "Clearing Next.js cache..."
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
}

# Start the Next.js development server
Write-Host "Starting Next.js development server..."
Start-Process powershell -ArgumentList "npm run dev"

Write-Host "App restarted successfully!"
Write-Host "App running at: http://localhost:3000"
