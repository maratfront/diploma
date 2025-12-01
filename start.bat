@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   Запуск проекта Diploma
echo ========================================
echo.

REM Проверка наличия Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ОШИБКА] Python не найден в PATH. Установите Python 3.8+ и добавьте его в PATH.
    pause
    exit /b 1
)

REM Проверка наличия Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ОШИБКА] Node.js не найден в PATH. Установите Node.js 16+ и добавьте его в PATH.
    pause
    exit /b 1
)

echo [✓] Python и Node.js найдены
echo.

REM Получаем путь к корневой директории проекта
set "PROJECT_ROOT=%~dp0"
set "SERVER_DIR=%PROJECT_ROOT%server"
set "CLIENT_DIR=%PROJECT_ROOT%client"
set "VENV_DIR=%SERVER_DIR%\.venv"

echo [1/7] Проверка структуры проекта...
if not exist "%SERVER_DIR%" (
    echo [ОШИБКА] Папка server не найдена!
    pause
    exit /b 1
)
if not exist "%CLIENT_DIR%" (
    echo [ОШИБКА] Папка client не найдена!
    pause
    exit /b 1
)
echo [✓] Структура проекта корректна
echo.

echo [2/7] Создание виртуального окружения Python...
if not exist "%VENV_DIR%" (
    echo Создание .venv в папке server...
    cd /d "%SERVER_DIR%"
    python -m venv .venv
    if %errorlevel% neq 0 (
        echo [ОШИБКА] Не удалось создать виртуальное окружение
        pause
        exit /b 1
    )
    echo [✓] Виртуальное окружение создано
) else (
    echo [✓] Виртуальное окружение уже существует
)
echo.

echo [3/7] Активация виртуального окружения и установка зависимостей сервера...
cd /d "%SERVER_DIR%"
call .venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo [ОШИБКА] Не удалось активировать виртуальное окружение
    pause
    exit /b 1
)

echo Обновление pip...
python -m pip install --upgrade pip --quiet

echo Установка зависимостей из requirements.txt...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ОШИБКА] Не удалось установить зависимости сервера
    pause
    exit /b 1
)
echo [✓] Зависимости сервера установлены
echo.

echo [4/7] Выполнение миграций базы данных...
python manage.py migrate --noinput
if %errorlevel% neq 0 (
    echo [ПРЕДУПРЕЖДЕНИЕ] Не удалось выполнить миграции (возможно, БД уже инициализирована)
)
echo [✓] Миграции выполнены
echo.

echo [5/7] Установка зависимостей клиента...
cd /d "%CLIENT_DIR%"
if not exist "node_modules" (
    echo Установка npm пакетов (это может занять некоторое время)...
    call npm install
    if %errorlevel% neq 0 (
        echo [ОШИБКА] Не удалось установить зависимости клиента
        pause
        exit /b 1
    )
    echo [✓] Зависимости клиента установлены
) else (
    echo [✓] Зависимости клиента уже установлены
)
echo.

echo [6/7] Запуск сервера Django...
cd /d "%SERVER_DIR%"
call .venv\Scripts\activate.bat
start "Diploma Server" cmd /k "python manage.py runserver && pause"
timeout /t 3 /nobreak >nul
echo [✓] Сервер запущен в отдельном окне (http://127.0.0.1:8000)
echo.

echo [7/7] Запуск клиента React...
cd /d "%CLIENT_DIR%"
start "Diploma Client" cmd /k "npm run dev && pause"
timeout /t 2 /nobreak >nul
echo [✓] Клиент запущен в отдельном окне (http://localhost:5173)
echo.

echo ========================================
echo   Проект успешно запущен!
echo ========================================
echo.
echo Сервер: http://127.0.0.1:8000
echo Клиент: http://localhost:5173
echo API Docs: http://127.0.0.1:8000/api/docs/
echo.
echo Для остановки закройте окна "Diploma Server" и "Diploma Client"
echo.
pause

