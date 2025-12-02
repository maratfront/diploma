@echo off
chcp 65001 >nul

rem Путь к корню проекта (папка, где лежит этот .bat)
set PROJECT_ROOT=%~dp0

rem --- Консоль для БЭКЕНДА ---
start "Diploma Backend" cmd /k cd /d %PROJECT_ROOT%server ^& python -m venv .venv ^& call .venv\Scripts\activate.bat ^& pip install -r requirements.txt ^& python manage.py runserver

rem --- Консоль для ФРОНТЕНДА ---
start "Diploma Frontend" cmd /k cd /d %PROJECT_ROOT%client ^& npm install ^& npm run dev

echo.
echo Открыты два окна:
echo   - Diploma Backend  (установка и запуск Django)
echo   - Diploma Frontend (установка и запуск React)
echo.
echo Для остановки приложения закройте эти окна.
echo.
pause


