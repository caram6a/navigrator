@echo off
chcp 65001 >nul
title НавИГРАтор - Запуск

echo ============================================
echo   НавИГРАтор - Запуск проекта
echo ============================================
echo.

:: Пытаемся запустить Frontend локально
echo [1/2] Запуск Frontend...
taskkill /f /im node.exe >nul 2>&1
cd /d "%~dp0frontend"
start "Frontend" cmd /c "npm run dev"
timeout /t 5 /nobreak >nul

echo.
echo ============================================
echo   Сайт запущен локально!
echo   http://localhost:3000
echo ============================================
echo.
echo ════════════════════════════════════════════
echo   ВАЖНО: Сайт на Vercel уже работает 24/7!
echo   Переходи по ссылке:
echo   https://navigrator.vercel.app
echo ════════════════════════════════════════════
echo.
echo Локально сайт нужен только для разработки.
echo Для просмотра - используй Vercel ссылку выше.
echo.
pause
exit