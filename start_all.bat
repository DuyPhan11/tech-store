@echo off
set "ROOT=%~dp0"

echo ====================================================
echo Starting Tech Store (Backend and Frontend)
echo ====================================================

if exist "%ROOT%.env.local" (
  for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%ROOT%.env.local") do (
    set "%%A=%%B"
  )
)

echo Database User: %DB_USERNAME%
echo [1/2] Starting Backend at http://localhost:8080 (Connecting to MySQL) ...
start "Tech Store - Backend" /D "%ROOT%backend" cmd /k "set DB_USERNAME=%DB_USERNAME%&& set DB_PASSWORD=%DB_PASSWORD%&& mvnw.cmd spring-boot:run"

echo Dang doi Backend khoi dong (khoang 5 giay)...
timeout /t 5 /nobreak >nul

echo [2/2] Starting Frontend at http://localhost:5173 ...
start "Tech Store - Frontend" /D "%ROOT%frontend" cmd /k "npm run dev"

echo.
echo ====================================================
echo Services started in separate terminal windows!
echo - Backend:  http://localhost:8080 (MySQL: tech_store)
echo - Frontend: http://localhost:5173
echo ====================================================
echo.
pause
