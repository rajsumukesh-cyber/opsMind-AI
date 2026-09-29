@echo off
echo ===================================================
echo Starting OpsMind AI Backend (FastAPI on Port 8000)
echo ===================================================
python -m uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
pause
