@echo off
REM Запуск Django сервера
start "Django Server" cmd /k "cd server && if not exist venv ( python -m venv venv ) && call venv\Scripts\activate && pip install -r requirements.txt && python manage.py runserver"

REM Запуск Vite клиента
start "Vite Client" cmd /k "cd client && npm install && npm run dev"