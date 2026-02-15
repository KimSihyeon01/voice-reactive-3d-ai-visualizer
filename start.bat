@echo off
chcp 65001 >nul 2>&1
echo.
echo ╔══════════════════════════════════════════════════╗
echo ║  Voice-Reactive 3D AI Visualizer                ║
echo ║  음성 반응형 3D AI 비주얼라이저                  ║
echo ╚══════════════════════════════════════════════════╝
echo.

:: 1. Ollama 확인
echo [1/4] Ollama 확인 중...
ollama list >nul 2>&1
if %errorlevel% neq 0 (
    echo [오류] Ollama가 설치되지 않았거나 실행 중이 아닙니다.
    echo        https://ollama.ai 에서 설치한 후 다시 시도해주세요.
    pause
    exit /b 1
)
echo       ✓ Ollama 정상

:: 2. Python venv 확인 및 생성
echo [2/4] Python 가상환경 확인 중...
if not exist "backend\venv" (
    echo       가상환경 생성 중...
    py -m venv backend\venv
    echo       의존성 설치 중...
    call backend\venv\Scripts\activate.bat && pip install -r backend\requirements.txt
)
echo       ✓ Python 가상환경 정상

:: 3. 백엔드 서버 시작
echo [3/4] 백엔드 서버 시작 중...
start "AI-Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\activate.bat && py app.py"
timeout /t 3 /nobreak >nul

:: 4. 프론트엔드 서버 시작
echo [4/4] 프론트엔드 서버 시작 중...
if not exist "frontend\node_modules" (
    echo       npm install 실행 중...
    cd frontend && npm install && cd ..
)
start "AI-Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 3 /nobreak >nul

:: 5. 브라우저 열기
echo.
echo ═══════════════════════════════════════════════════
echo   브라우저에서 http://localhost:5173 을 엽니다...
echo   종료하려면 열린 터미널 창들을 모두 닫으세요.
echo ═══════════════════════════════════════════════════
start http://localhost:5173
