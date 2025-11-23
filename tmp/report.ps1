# ================================
# GUSS PROJECT REPORT (CLEAN)
# PyCharm + Windows + PowerShell
# ================================

$report = "tmp/report.txt"
"" | Out-File $report -Encoding UTF8

function Log($text) {
    Add-Content $report $text
}

# ------------------------------------
# ENVIRONMENT
# ------------------------------------
Log "==============================="
Log "        GUSS DEV REPORT"
Log "==============================="
Log ""
Log "=== CONTEXT ==="
Log ("Running in PyCharm terminal: " + ($(Get-Process | Where-Object { $_.Name -like 'pycharm*' }).Count -gt 0))
Log ("Current folder: " + (Get-Location).Path)
Log ("Console Encoding: " + [Console]::OutputEncoding.EncodingName)
Log ""

Log "=== SYSTEM ==="
Log ("Windows: " + (Get-ComputerInfo).WindowsProductName)
Log ("PowerShell: " + $PSVersionTable.PSVersion)
Log ("Node: " + (node -v))
Log ("npm: " + (npm -v))
Log ("Git: " + (git --version))
Log ("Docker: " + (docker --version))
Log ("Docker Compose: " + (docker compose version))
Log ""

# ------------------------------------
# DOCKER STATUS
# ------------------------------------
Log "=== DOCKER STATUS ==="
docker ps | Out-String | Log
Log ""
Log "--- Ports ---"
Log ("5432 Postgres: " + (Test-NetConnection localhost -Port 5432).TcpTestSucceeded)
Log ("3000 Backend:  " + (Test-NetConnection localhost -Port 3000).TcpTestSucceeded)
Log ("5173 Frontend: " + (Test-NetConnection localhost -Port 5173).TcpTestSucceeded)
Log ""

# ------------------------------------
# ADDED: DOCKER LOGS
# ------------------------------------
Log "=== BACKEND LOG (LAST 40) ==="
docker logs guss_backend --tail 40 2>&1 | Out-String | Log
Log ""

Log "=== FRONTEND LOG (LAST 40) ==="
docker logs guss_frontend --tail 40 2>&1 | Out-String | Log
Log ""

Log "=== POSTGRES LOG (LAST 40) ==="
docker logs guss_pg --tail 40 2>&1 | Out-String | Log
Log ""

# ------------------------------------
# PROJECT STRUCTURE (CLEAN)
# ------------------------------------
function AddFile($label, $path) {
    if (Test-Path $path) {
        Log "[$label]"
        Log (" - " + $path)
        Log ""
    }
}

function AddSourceTree($label, $path, $patterns) {
    Log "[$label]"
    foreach ($pattern in $patterns) {
        Get-ChildItem -Path $path -Include $pattern -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
            $relative = $_.FullName.Replace((Get-Location).Path + "\","")
            Log (" - " + $relative)
        }
    }
    Log ""
}

Log "=== PROJECT FILES ==="
Log ""

# BACKEND
AddFile "backend/package.json" "backend/package.json"
AddFile "backend/tsconfig.json" "backend/tsconfig.json"
AddFile "backend/Dockerfile" "backend/Dockerfile"
AddFile "backend/.env" "backend/.env"
AddFile "backend/prisma/schema.prisma" "backend/prisma/schema.prisma"
AddFile "backend/wait-for-postgres.sh" "backend/wait-for-postgres.sh"
AddSourceTree "backend/src" "backend/src" @("*.ts")

# FRONTEND
AddFile "frontend/package.json" "frontend/package.json"
AddFile "frontend/tsconfig.json" "frontend/tsconfig.json"
AddFile "frontend/Dockerfile" "frontend/Dockerfile"
AddFile "frontend/vite.config.ts" "frontend/vite.config.ts"
AddFile "frontend/index.html" "frontend/index.html"
AddSourceTree "frontend/src" "frontend/src" @("*.ts", "*.tsx")

# ROOT
AddFile "docker-compose.yml" "docker-compose.yml"

# ------------------------------------
# ADDED: DIST CHECK
# ------------------------------------
Log "=== BACKEND DIST CONTENT ==="
if (Test-Path "backend/dist") {
    Get-ChildItem "backend/dist" -Recurse | Out-String | Log
} else {
    Log "backend/dist does NOT exist"
}
Log ""

# ------------------------------------
# ADDED: PRISMA VALIDATION
# ------------------------------------
Log "=== PRISMA VALIDATION ==="
cd backend
npx prisma validate 2>&1 | Out-String | Log
cd ..
Log ""

# ------------------------------------
# PACKAGE VERSIONS
# ------------------------------------
Log "=== BACKEND PACKAGES ==="
npm list --prefix backend --depth=0 | Out-String | Log
Log ""

Log "=== FRONTEND PACKAGES ==="
npm list --prefix frontend --depth=0 | Out-String | Log
Log ""

Log "=== END REPORT ==="
