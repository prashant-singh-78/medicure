# Persistent Startup Script for Medicure Link
while ($true) {
    Write-Host "$(Get-Date): Starting Medicure Link servers (Backend & Frontend)..."
    # Ensure we are in the correct directory
    Set-Location -Path "d:\prash projects\fy project\smart-health-assistant"
    # Run the development servers
    npm run dev
    Write-Host "$(Get-Date): Servers exited unexpectedly. Restarting in 10 seconds..."
    Start-Sleep -Seconds 10
}
