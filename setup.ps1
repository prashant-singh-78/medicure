Write-Host "Setting up Frontend (React Vite)..."

Set-Location "d:\prash projects\fy project\smart-health-assistant"

# Install Vite globally (optional)
npm install -g create-vite

# Create frontend
npm create vite@latest frontend -- --template react

Set-Location frontend
npm install
Set-Location ..

Write-Host "Setting up Backend (FastAPI)..."

Set-Location backend
# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

Write-Host "Setup Completed Successfully!"
