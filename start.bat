@echo off
chcp 65001 >nul
title НавИГРАтор - Запуск

echo ============================================
echo   НавИГРАтор - Запуск проекта
echo ============================================
echo.

:: Проверяем Docker
docker info >nul 2>&1
if %errorlevel% equ 0 (
    echo [Docker найден] Запуск через Docker Compose...
    echo.
    cd /d "%~dp0"
    docker-compose up -d
    if %errorlevel% equ 0 (
        echo ============================================
        echo   Проект запущен через Docker!
        echo   Frontend: http://localhost:3000
        echo   Backend:  http://localhost:4000
        echo ============================================
    ) else (
        echo [ОШИБКА] Не удалось запустить Docker Compose.
    )
    goto ngrok
)

echo [Docker не найден] Запуск в локальном режиме...
echo.

:: Проверяем, не занят ли порт
netstat -ano | findstr :3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo Frontend уже запущен на http://localhost:3000
) else (
    echo [1/2] Запуск Frontend...
    start "Frontend" cmd /c "cd /d "%~dp0frontend" && npm run dev"
    timeout /t 3 /nobreak >nul
)

netstat -ano | findstr :4000 >nul 2>&1
if %errorlevel% equ 0 (
    echo Backend уже запущен на http://localhost:4000
) else (
    echo [2/2] Запуск Backend...
    start "Backend" cmd /c "cd /d "%~dp0backend" && npm run dev"
)

:ngrok
echo.
echo ============================================
echo   Проект запущен!
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:4000
echo ============================================
echo.
echo Хотите открыть доступ через ngrok? (Y/N)
set /p ngrok_choice="Ваш выбор (Y/N): "
if /i "%ngrok_choice%"=="Y" goto start_ngrok
exit

:start_ngrok
echo.
echo Запуск ngrok...
echo.
if exist "c:\Navigrator\tunnel\ngrok.exe" (
    taskkill /f /im ngrok.exe >nul 2>&1
    start "ngrok" cmd /c "c:\Navigrator\tunnel\ngrok.exe http 3000 --config c:\Navigrator\tunnel\ngrok.yml"
    timeout /t 5 /nobreak >nul
    echo.
    echo ============================================
    echo   ngrok запущен!
    echo   Публичная ссылка: https://outplayed-hasty-extending.ngrok-free.dev
    echo   Веб-интерфейс:    http://localhost:4040
    echo ============================================
    echo.
    echo Открываю сайт в браузере...
    start https://outplayed-hasty-extending.ngrok-free.dev
    echo.
    echo ============================================
    echo   Как открыть сайт:
    echo   1. Ярлык на рабочем столе: НАВИГРАТОР
    echo   2. В браузере: навигратор
    echo   3. Ссылка выше
    echo ============================================
    echo.
) else (
    echo [ОШИБКА] ngrok не найден в c:\Navigrator\tunnel
    echo.
    echo Возможно антивирус удалил файл.
    echo Переключитесь в ACT MODE в VS Code, я скачаю заново.
)
pause
exit