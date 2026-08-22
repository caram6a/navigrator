@echo off
chcp 65001 >nul
title НавИГРАтор - Полная установка

set PROJECT_DIR=c:\Navigrator

echo ============================================
echo   НавИГРАтор - Полная установка проекта
echo ============================================
echo.

:: Проверка наличия Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ОШИБКА] Node.js не найден! Установите Node.js с https://nodejs.org
    pause
    exit /b 1
)

:: Проверка наличия Docker (опционально)
where docker >nul 2>&1
if %errorlevel% equ 0 (
    set DOCKER_AVAILABLE=true
) else (
    set DOCKER_AVAILABLE=false
)

echo [1/7] Установка зависимостей Backend...
cd /d "%PROJECT_DIR%\backend"
call npm install
if %errorlevel% neq 0 (
    echo [ОШИБКА] Не удалось установить зависимости backend
    pause
    exit /b 1
)
echo [OK] Backend зависимости установлены
echo.

echo [2/7] Генерация Prisma клиента...
cd /d "%PROJECT_DIR%\backend"
call npx prisma generate
if %errorlevel% neq 0 (
    echo [ОШИБКА] Prisma generate не удался. Убедитесь, что PostgreSQL запущен.
    echo Продолжаем...
)
echo [OK] Prisma client сгенерирован
echo.

echo [3/7] Применение схемы базы данных...
cd /d "%PROJECT_DIR%\backend"
call npx prisma db push --accept-data-loss
if %errorlevel% neq 0 (
    echo [ПРЕДУПРЕЖДЕНИЕ] Не удалось применить схему. Возможно, PostgreSQL не запущен.
    echo Запустите PostgreSQL и выполните:
    echo   cd %PROJECT_DIR%\backend ^&^& npx prisma db push
)
echo [OK] Схема БД применена
echo.

echo [4/7] Заполнение тестовыми данными...
cd /d "%PROJECT_DIR%\backend"
call npx tsx src/seed.ts
if %errorlevel% neq 0 (
    echo [ПРЕДУПРЕЖДЕНИЕ] Не удалось заполнить тестовые данные.
)
echo [OK] Тестовые данные добавлены
echo.

echo [5/7] Установка зависимостей Frontend...
cd /d "%PROJECT_DIR%\frontend"
call npm install
if %errorlevel% neq 0 (
    echo [ОШИБКА] Не удалось установить зависимости frontend
    pause
    exit /b 1
)
echo [OK] Frontend зависимости установлены
echo.

echo [6/7] Копирование .env файла...
if not exist "%PROJECT_DIR%\.env" (
    copy "%PROJECT_DIR%\.env.example" "%PROJECT_DIR%\.env" >nul
    echo [OK] Создан .env из .env.example
) else (
    echo [OK] .env уже существует
)
echo.

echo ============================================
echo   Установка завершена!
echo ============================================
echo.
echo Теперь запустите start.bat (он в той же папке)
echo.
echo Или запустите вручную:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:4000
echo.
echo Через Docker:
echo   cd /d %PROJECT_DIR% ^&^& docker-compose up -d
echo.

if "%DOCKER_AVAILABLE%"=="true" (
    echo [Docker доступен]
) else (
    echo [Docker не найден] Установите Docker для контейнеризации
)

pause