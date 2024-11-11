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

# Install dependencies if needed
Write-Host "Checking dependencies..."
if (!(Test-Path "node_modules")) {
    Write-Host "Installing dependencies..."
    npm install
}

# Start the Next.js development server in the current window
Write-Host "Starting Next.js development server..."
Write-Host "App will be running at: http://localhost:3000"
npm run dev
