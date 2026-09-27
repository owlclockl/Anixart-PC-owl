@echo off
rem ===========================================================================
rem  AniDesk / Anixart-PC-owl
rem  Полная сборка проекта с нуля до установщика .exe для Windows
rem
rem  Что делает скрипт:
rem    1. Проверяет окружение: Node.js, npm, git, место на диске, путь к проекту
rem    2. Чистит прошлые сборки
rem    3. Ставит npm-зависимости и бинарник Electron
rem    4. Собирает фронтенд через Vite
rem    5. Пакует Electron и делает установщик через Electron Forge + Squirrel
rem    6. Показывает готовый .exe и предлагает его открыть или запустить
rem
rem  Версия скрипта: 1.0
rem  Запуск: двойной клик по файлу или из консоли: build-installer.bat
rem  Справка по параметрам: build-installer.bat /help
rem ===========================================================================

setlocal EnableExtensions EnableDelayedExpansion

rem --- запоминаем кодовую страницу консоли и переключаемся на UTF-8 ----------
set "OLD_CP="
for /f "tokens=2 delims=:." %%c in ('chcp 2^>nul') do set "OLD_CP=%%c"
if defined OLD_CP set "OLD_CP=%OLD_CP: =%"
chcp 65001 >nul 2>&1

title AniDesk - сборка установщика

rem --- переходим в папку скрипта, pushd умеет и в сетевые UNC-пути -----------
pushd "%~dp0" 2>nul
if errorlevel 1 (
    echo [ОШИБКА] Не удалось перейти в папку скрипта: %~dp0
    pause
    exit /b 1
)

set "SCRIPT_NAME=%~nx0"
set "PROJECT_DIR=%CD%"
set "LOGFILE=%CD%\build.log"
set "EXIT_CODE=0"

rem --- параметры по умолчанию ------------------------------------------------
set "DO_CLEAN=0"
set "SKIP_INSTALL=0"
set "MAKE_ZIP=0"
set "USE_MIRROR=0"
set "AUTO_YES=0"
set "CI_MODE=0"
set "TARGET_ARCH="

rem --- тихие и терпеливые настройки npm --------------------------------------
set "npm_config_audit=false"
set "npm_config_fund=false"
set "npm_config_fetch_retries=5"
set "npm_config_fetch_timeout=600000"

rem --- чистим переменные, которые ломают сборку, если остались от других задач
rem     NODE_ENV=production заставил бы npm пропустить devDependencies,
rem     а без них нет ни Vite, ни Electron Forge
set "NODE_ENV="
set "npm_config_omit="
set "npm_config_production="
set "ELECTRON_SKIP_BINARY_DOWNLOAD="

rem ===========================================================================
rem  Разбор параметров командной строки
rem ===========================================================================
:parse_args
if "%~1"=="" goto :args_done
if /i "%~1"=="/clean"   ( set "DO_CLEAN=1"     & shift & goto :parse_args )
if /i "%~1"=="/fast"    ( set "SKIP_INSTALL=1" & shift & goto :parse_args )
if /i "%~1"=="/zip"     ( set "MAKE_ZIP=1"     & shift & goto :parse_args )
if /i "%~1"=="/mirror"  ( set "USE_MIRROR=1"   & shift & goto :parse_args )
if /i "%~1"=="/yes"     ( set "AUTO_YES=1"     & shift & goto :parse_args )
if /i "%~1"=="/y"       ( set "AUTO_YES=1"     & shift & goto :parse_args )
if /i "%~1"=="/ci"      ( set "CI_MODE=1"      & set "AUTO_YES=1" & shift & goto :parse_args )
if /i "%~1"=="/x64"     ( set "TARGET_ARCH=x64"   & shift & goto :parse_args )
if /i "%~1"=="/arm64"   ( set "TARGET_ARCH=arm64" & shift & goto :parse_args )
if /i "%~1"=="/ia32"    ( set "TARGET_ARCH=ia32"  & shift & goto :parse_args )
if /i "%~1"=="/help"    goto :usage
if /i "%~1"=="-h"       goto :usage
if /i "%~1"=="--help"   goto :usage
if /i "%~1"=="/?"       goto :usage
echo.
echo [ОШИБКА] Неизвестный параметр: %~1
goto :usage

:usage
echo.
echo   Сборка AniDesk: исходники до установщика .exe
echo.
echo   Использование:  %SCRIPT_NAME% [параметры]
echo.
echo     без параметров  обычная полная сборка: зависимости, Vite, установщик
echo     /clean          сборка с нуля: снести node_modules, package-lock.json,
echo                     out, public\build и только после этого собирать
echo     /fast           пропустить npm install, если зависимости уже стоят
echo     /zip            дополнительно собрать портативный ZIP-архив
echo     /mirror         сразу качать Electron с зеркала, если GitHub недоступен
echo     /x64 /arm64     собрать под конкретную архитектуру
echo     /yes            отвечать "да" на все вопросы
echo     /ci             режим без вопросов и без паузы в конце
echo     /help           эта справка
echo.
echo   Примеры:
echo     %SCRIPT_NAME%
echo     %SCRIPT_NAME% /clean /zip
echo     %SCRIPT_NAME% /ci /x64
echo.
popd
if defined OLD_CP chcp %OLD_CP% >nul 2>&1
endlocal & exit /b 0

:args_done

rem ===========================================================================
rem  Старт
rem ===========================================================================
call :start_timer
call :read_version

> "%LOGFILE%" echo === AniDesk build log ===
>>"%LOGFILE%" echo Дата: %DATE% %TIME%
>>"%LOGFILE%" echo Папка: %PROJECT_DIR%
>>"%LOGFILE%" echo Версия приложения: %APP_VERSION%
>>"%LOGFILE%" echo Параметры: clean=%DO_CLEAN% fast=%SKIP_INSTALL% zip=%MAKE_ZIP% mirror=%USE_MIRROR% arch=%TARGET_ARCH%

cls
echo.
echo ===========================================================================
echo                AniDesk - сборка установщика для Windows
echo ===========================================================================
echo   Проект:  %PROJECT_DIR%
echo   Версия:  %APP_VERSION%
echo   Лог:     %LOGFILE%
echo ===========================================================================

call :step_env
if errorlevel 1 goto :failed

call :step_clean
if errorlevel 1 goto :failed

call :step_install
if errorlevel 1 goto :failed

call :step_build
if errorlevel 1 goto :failed

call :step_make
if errorlevel 1 goto :failed

call :step_result
if errorlevel 1 goto :failed

goto :finished


rem ===========================================================================
rem  ШАГ 1. Проверка окружения
rem ===========================================================================
:step_env
call :head "[1/6] Проверка окружения"

if not exist "package.json" (
    call :err "В этой папке нет package.json"
    goto :env_bad_folder
)
if not exist "forge.config.js" (
    call :err "В этой папке нет forge.config.js"
    goto :env_bad_folder
)
if not exist "src\main.js" (
    call :err "Не найден файл src\main.js, проект скачан не полностью"
    goto :env_bad_folder
)
call :ok "Файлы проекта на месте"

rem --- Node.js ---------------------------------------------------------------
call :ensure_node
if errorlevel 1 exit /b 1

rem --- npm -------------------------------------------------------------------
set "NPM_VER="
for /f "delims=" %%v in ('npm -v 2^>nul') do set "NPM_VER=%%v"
if not defined NPM_VER (
    call :err "npm не найден, хотя Node.js установлен"
    call :say "   Переустановите Node.js с сайта https://nodejs.org/"
    exit /b 1
)
call :ok "npm !NPM_VER!"

rem --- git нужен как запасной путь для git-зависимости @electron/node-gyp ----
set "GIT_VER="
for /f "tokens=3" %%v in ('git --version 2^>nul') do set "GIT_VER=%%v"
if defined GIT_VER (
    call :ok "git !GIT_VER!"
) else (
    call :warn "git не найден. Чаще всего установка проходит и без него,"
    call :say "   но если npm install упадёт на @electron/node-gyp - поставьте Git:"
    call :say "   https://git-scm.com/download/win"
)

rem --- свободное место на диске ----------------------------------------------
set "FREE_GB="
set "DRV=%CD:~0,1%"
where powershell >nul 2>nul
if errorlevel 1 goto :skip_disk_check
for /f "delims=" %%g in ('powershell -NoProfile -Command "[int]((Get-PSDrive %DRV%).Free/1GB)" 2^>nul') do set "FREE_GB=%%g"
if not defined FREE_GB goto :skip_disk_check
set /a "FREE_NUM=FREE_GB" 2>nul
if not defined FREE_NUM goto :skip_disk_check
if !FREE_NUM! LSS 3 (
    call :warn "На диске %DRV%: свободно всего !FREE_NUM! ГБ, для сборки нужно около 3 ГБ"
) else (
    call :ok "Свободно на диске %DRV%: !FREE_NUM! ГБ"
)
:skip_disk_check

rem --- предупреждения по пути к проекту --------------------------------------
echo "%PROJECT_DIR%"| findstr /r "[^ -~]" >nul 2>nul
if not errorlevel 1 (
    call :warn "В пути к проекту есть кириллица или другие не-ASCII символы"
    call :say "   Squirrel и node-gyp иногда с этим не дружат."
    call :say "   Если сборка упадёт - перенесите проект, например, в C:\dev\anidesk"
)
if not "!PROJECT_DIR:~150,1!"=="" (
    call :warn "Очень длинный путь к проекту, возможны ошибки из-за лимита MAX_PATH"
    call :say "   Перенесите проект ближе к корню диска, например в C:\dev\anidesk"
)
echo "%PROJECT_DIR%"| findstr /i "OneDrive" >nul 2>nul
if not errorlevel 1 (
    call :warn "Проект лежит внутри папки OneDrive"
    call :say "   Синхронизация блокирует файлы, лучше собирать вне OneDrive"
)

rem --- запущенное приложение мешает перезаписать папку out -------------------
call :kill_running
exit /b 0

:env_bad_folder
call :say "   Положите %SCRIPT_NAME% в корень проекта AniDesk рядом с package.json"
call :say "   и запустите его заново."
exit /b 1


rem ===========================================================================
rem  Node.js: проверка версии и при желании автоустановка
rem ===========================================================================
:ensure_node
set "NODE_VER="
for /f "delims=" %%v in ('node -v 2^>nul') do set "NODE_VER=%%v"

if not defined NODE_VER (
    call :warn "Node.js не найден"
    call :install_node
    set "NODE_VER="
    for /f "delims=" %%v in ('node -v 2^>nul') do set "NODE_VER=%%v"
)
if not defined NODE_VER (
    call :err "Node.js не установлен, без него собрать проект нельзя"
    call :say "   Скачайте версию LTS тут: https://nodejs.org/"
    call :say "   После установки закройте это окно и запустите %SCRIPT_NAME% заново"
    exit /b 1
)

set "NODE_NUM=!NODE_VER:v=!"
set "NODE_MAJOR="
for /f "tokens=1 delims=." %%a in ("!NODE_NUM!") do set "NODE_MAJOR=%%a"
set "NODE_MAJOR_NUM="
set /a "NODE_MAJOR_NUM=NODE_MAJOR" 2>nul
if not defined NODE_MAJOR_NUM (
    call :warn "Не удалось определить версию Node.js, продолжаем как есть: !NODE_VER!"
    exit /b 0
)
if !NODE_MAJOR_NUM! LSS 18 (
    call :err "Node.js !NODE_VER! слишком старый, нужен минимум 18, лучше 20 или 22 LTS"
    call :install_node
    set "NODE_VER="
    for /f "delims=" %%v in ('node -v 2^>nul') do set "NODE_VER=%%v"
    if not defined NODE_VER exit /b 1
    call :ok "Установлен Node.js !NODE_VER!"
    exit /b 0
)
call :ok "Node.js !NODE_VER!"
exit /b 0

:install_node
where winget >nul 2>nul
if errorlevel 1 (
    call :say "   winget недоступен, поставьте Node.js LTS вручную: https://nodejs.org/"
    exit /b 0
)
call :ask "Установить Node.js LTS через winget прямо сейчас"
if errorlevel 1 exit /b 0
call :say "   Ставим Node.js LTS, это займёт пару минут..."
winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
rem --- подхватываем свежий PATH без перезапуска консоли ----------------------
if exist "%ProgramFiles%\nodejs\node.exe"          set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%ProgramFiles(x86)%\nodejs\node.exe"     set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
if exist "%APPDATA%\npm"                           set "PATH=%APPDATA%\npm;%PATH%"
exit /b 0


rem ===========================================================================
rem  ШАГ 2. Очистка прошлых сборок
rem ===========================================================================
:step_clean
call :head "[2/6] Очистка прошлых сборок"

call :rmdir_safe "out"
call :rmdir_safe "public\build"
call :rmdir_safe "node_modules\.vite"
call :rmdir_safe ".vite"

if "%DO_CLEAN%"=="1" (
    call :say "   Режим /clean: сносим зависимости и лок-файл"
    call :rmdir_safe "node_modules"
    if exist "package-lock.json" del /f /q "package-lock.json" >nul 2>nul
)

call :ok "Рабочая папка готова к сборке"
exit /b 0


rem ===========================================================================
rem  ШАГ 3. Зависимости npm и бинарник Electron
rem ===========================================================================
:step_install
call :head "[3/6] Установка зависимостей"

if "%SKIP_INSTALL%"=="1" (
    if exist "node_modules\electron\package.json" (
        call :ok "Режим /fast: npm install пропущен"
        goto :check_electron_binary
    )
    call :warn "Указан /fast, но зависимости не установлены, ставим их"
)

if "%USE_MIRROR%"=="1" call :enable_mirror

call :say "   npm install --legacy-peer-deps   [попытка 1 из 3]"
call npm install --legacy-peer-deps
if not errorlevel 1 goto :check_electron_binary

call :warn "Первая попытка не удалась, чистим кэш npm и пробуем снова"
call npm cache clean --force >nul 2>nul
call :say "   npm install --legacy-peer-deps   [попытка 2 из 3]"
call npm install --legacy-peer-deps
if not errorlevel 1 goto :check_electron_binary

call :warn "Не вышло и со второй попытки, включаем зеркало для Electron"
call :enable_mirror
call :say "   npm install --legacy-peer-deps   [попытка 3 из 3]"
call npm install --legacy-peer-deps
if not errorlevel 1 goto :check_electron_binary

call :err "npm install не отработал"
call :say "   Что обычно помогает:"
call :say "     - проверить интернет, VPN или настройки прокси"
call :say "     - установить Git: https://git-scm.com/download/win"
call :say "     - запустить %SCRIPT_NAME% /clean"
call :say "     - запустить %SCRIPT_NAME% /mirror, если GitHub недоступен"
exit /b 1

:check_electron_binary
rem --- бинарник Electron качается отдельно и падает чаще всего именно он -----
if exist "node_modules\electron\dist\electron.exe" (
    call :ok "Зависимости установлены, Electron на месте"
    exit /b 0
)
call :warn "Бинарник Electron не скачался, докачиваем его с зеркала"
call :enable_mirror
if not exist "node_modules\electron\install.js" (
    call :err "Пакет electron установлен неправильно, запустите %SCRIPT_NAME% /clean"
    exit /b 1
)
pushd "node_modules\electron"
node install.js
popd
if exist "node_modules\electron\dist\electron.exe" (
    call :ok "Electron успешно докачан"
    exit /b 0
)
call :err "Не удалось скачать бинарник Electron"
call :say "   Проверьте доступ к github.com, включите VPN и запустите скрипт заново"
exit /b 1

:enable_mirror
set "ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/"
call :say "   Зеркало Electron: %ELECTRON_MIRROR%"
exit /b 0


rem ===========================================================================
rem  ШАГ 4. Сборка интерфейса через Vite
rem ===========================================================================
:step_build
call :head "[4/6] Сборка интерфейса через Vite"

call npm run build
if errorlevel 1 (
    call :err "Vite не смог собрать фронтенд"
    call :say "   Разбирайте ошибки выше: обычно это опечатка в src или битые зависимости"
    call :say "   Часто лечится полной пересборкой: %SCRIPT_NAME% /clean"
    exit /b 1
)
if not exist "public\build\index.html" (
    call :err "Сборка прошла, но файл public\build\index.html не появился"
    call :say "   Проверьте параметр build.outDir в vite.config.ts"
    exit /b 1
)
call :ok "Фронтенд собран в public\build"
exit /b 0


rem ===========================================================================
rem  ШАГ 5. Упаковка Electron и создание установщика
rem ===========================================================================
:step_make
call :head "[5/6] Упаковка Electron и создание установщика"
call :say "   Первый запуск самый долгий: качаются Electron и утилиты Squirrel"

if defined TARGET_ARCH (
    call :say "   Целевая архитектура: %TARGET_ARCH%"
    call npm run make -- --arch=%TARGET_ARCH%
) else (
    call npm run make
)
if errorlevel 1 (
    call :err "Electron Forge не смог собрать установщик"
    call :say "   Частые причины:"
    call :say "     - AniDesk всё ещё запущен и держит файлы в папке out"
    call :say "     - антивирус удаляет временные файлы Squirrel, добавьте папку в исключения"
    call :say "     - не установлен .NET Framework 4.8, поставьте его с сайта Microsoft"
    call :say "     - кириллица в пути к проекту"
    call :say "   Попробуйте запустить: %SCRIPT_NAME% /clean"
    exit /b 1
)
call :ok "Electron Forge отработал без ошибок"
exit /b 0


rem ===========================================================================
rem  ШАГ 6. Проверка результата
rem ===========================================================================
:step_result
call :head "[6/6] Проверка результата"

set "SETUP_EXE="
for /f "delims=" %%f in ('dir /b /s /a-d /o-d "out\make\*.exe" 2^>nul') do (
    if not defined SETUP_EXE set "SETUP_EXE=%%~ff"
)
if not defined SETUP_EXE (
    call :err "Установщик .exe в папке out\make не найден"
    call :say "   Посмотрите содержимое папки out\make и сообщения Electron Forge выше"
    exit /b 1
)

set "SETUP_SIZE=0"
for %%f in ("%SETUP_EXE%") do set /a "SETUP_SIZE=%%~zf/1048576"
if !SETUP_SIZE! LSS 10 call :warn "Установщик подозрительно маленький: !SETUP_SIZE! МБ"
call :ok "Установщик собран"

rem --- проверяем, что внутрь пакета попал собранный интерфейс ----------------
set "ASAR_FOUND=0"
for /d %%d in (out\AniDesk-win32-*) do (
    if exist "%%~fd\resources\app.asar" set "ASAR_FOUND=1"
)
if "!ASAR_FOUND!"=="1" (
    call :ok "Приложение упаковано в app.asar"
) else (
    call :warn "Файл resources\app.asar не найден, проверьте содержимое папки out"
)

call :say "   Содержимое папки out\make:"
for /f "delims=" %%f in ('dir /b /s /a-d "out\make\*" 2^>nul') do call :say "     %%~nxf"

set "PORTABLE_ZIP="
if "%MAKE_ZIP%"=="1" call :make_portable_zip
exit /b 0

:make_portable_zip
set "PKG_DIR="
for /d %%d in (out\AniDesk-win32-*) do set "PKG_DIR=%%~fd"
if not defined PKG_DIR for /d %%d in (out\anidesk-win32-*) do set "PKG_DIR=%%~fd"
if not defined PKG_DIR (
    call :warn "Папка с распакованным приложением не найдена, ZIP пропущен"
    exit /b 0
)
where powershell >nul 2>nul
if errorlevel 1 (
    call :warn "PowerShell недоступен, ZIP пропущен"
    exit /b 0
)
for %%d in ("%PKG_DIR%") do set "PKG_NAME=%%~nxd"
set "PS_SRC=%PKG_DIR%"
set "PS_DST=%PROJECT_DIR%\out\make\%PKG_NAME%-%APP_VERSION%-portable.zip"
call :say "   Пакуем портативную версию в ZIP, это займёт минуту..."
powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path (Join-Path $env:PS_SRC '*') -DestinationPath $env:PS_DST -Force" >nul 2>nul
if exist "%PS_DST%" (
    set "PORTABLE_ZIP=%PS_DST%"
    call :ok "Портативный ZIP собран"
) else (
    call :warn "Собрать ZIP не получилось"
)
exit /b 0


rem ===========================================================================
rem  Финал
rem ===========================================================================
:finished
call :stop_timer
echo.
echo ===========================================================================
echo                         СБОРКА ЗАВЕРШЕНА УСПЕШНО
echo ===========================================================================
echo.
echo   Установщик:
echo     %SETUP_EXE%
echo     размер примерно %SETUP_SIZE% МБ
if defined PORTABLE_ZIP echo.
if defined PORTABLE_ZIP echo   Портативная версия:
if defined PORTABLE_ZIP echo     %PORTABLE_ZIP%
echo.
echo   Все файлы сборки лежат тут:
echo     %PROJECT_DIR%\out\make
echo.
if defined ELAPSED_TEXT echo   Время сборки: %ELAPSED_TEXT%
echo   Лог сборки:   %LOGFILE%
echo.
echo   Установщик не подписан сертификатом, поэтому SmartScreen при первом
echo   запуске покажет предупреждение. Нажмите "Подробнее", затем
echo   "Выполнить в любом случае".
echo ===========================================================================
echo.
>>"%LOGFILE%" echo РЕЗУЛЬТАТ: OK %SETUP_EXE%

if "%CI_MODE%"=="1" goto :bye
if "%AUTO_YES%"=="1" (
    start "" explorer /select,"%SETUP_EXE%"
    goto :bye
)

call :ask "Открыть папку с установщиком"
if not errorlevel 1 start "" explorer /select,"%SETUP_EXE%"

call :ask "Запустить установщик прямо сейчас"
if not errorlevel 1 start "" "%SETUP_EXE%"
goto :bye

:failed
call :stop_timer
set "EXIT_CODE=1"
echo.
echo ===========================================================================
echo                           СБОРКА НЕ УДАЛАСЬ
echo ===========================================================================
echo   Причина описана выше. Подробные логи npm обычно лежат тут:
echo     %LOCALAPPDATA%\npm-cache\_logs
echo   Краткий лог этой сборки: %LOGFILE%
echo.
echo   Что попробовать:
echo     1. %SCRIPT_NAME% /clean     полная пересборка с нуля
echo     2. %SCRIPT_NAME% /mirror    если не качается Electron
echo     3. перенести проект в путь без кириллицы, например в C:\dev\anidesk
echo ===========================================================================
echo.
>>"%LOGFILE%" echo РЕЗУЛЬТАТ: ОШИБКА

:bye
if "%CI_MODE%"=="0" pause
popd
if defined OLD_CP chcp %OLD_CP% >nul 2>&1
endlocal & exit /b %EXIT_CODE%


rem ===========================================================================
rem  Вспомогательные подпрограммы
rem ===========================================================================

:read_version
set "APP_VERSION=0.0.0"
set "VER_RAW="
for /f "tokens=2 delims=:" %%v in ('findstr /i /c:"version" package.json 2^>nul') do (
    if not defined VER_RAW set "VER_RAW=%%v"
)
if not defined VER_RAW exit /b 0
set "VER_RAW=%VER_RAW: =%"
set VER_RAW=%VER_RAW:"=%
set "VER_RAW=%VER_RAW:,=%"
if not "%VER_RAW%"=="" set "APP_VERSION=%VER_RAW%"
exit /b 0

:head
echo.
echo ---------------------------------------------------------------------------
echo  %~1
echo ---------------------------------------------------------------------------
>>"%LOGFILE%" echo.
>>"%LOGFILE%" echo [%TIME%] %~1
exit /b 0

:say
if "%~1"=="" (echo.) else (echo %~1)
>>"%LOGFILE%" echo [%TIME%] %~1
exit /b 0

:ok
echo   [ ГОТОВО ] %~1
>>"%LOGFILE%" echo [%TIME%] OK: %~1
exit /b 0

:warn
echo   [ ВНИМАНИЕ ] %~1
>>"%LOGFILE%" echo [%TIME%] WARN: %~1
exit /b 0

:err
echo.
echo   [ ОШИБКА ] %~1
>>"%LOGFILE%" echo [%TIME%] ERROR: %~1
exit /b 0

rem --- вопрос пользователю: errorlevel 0 значит да, 1 значит нет -------------
:ask
if "%AUTO_YES%"=="1" exit /b 0
where choice >nul 2>nul
if errorlevel 1 (
    set "ANSWER="
    set /p "ANSWER=   %~1 [y/n]: "
    if /i "!ANSWER!"=="y" exit /b 0
    if /i "!ANSWER!"=="yes" exit /b 0
    if /i "!ANSWER!"=="д" exit /b 0
    if /i "!ANSWER!"=="да" exit /b 0
    exit /b 1
)
choice /c YN /n /m "   %~1 ? [Y - да, N - нет]: "
if errorlevel 2 exit /b 1
exit /b 0

rem --- удаление папки с повторами, если файлы заняты -------------------------
:rmdir_safe
if not exist "%~1" exit /b 0
call :say "   Удаляем %~1"
for /l %%i in (1,1,3) do (
    rd /s /q "%~1" >nul 2>nul
    if not exist "%~1" exit /b 0
    ping -n 3 127.0.0.1 >nul 2>nul
)
call :warn "Не удалось полностью удалить %~1, файлы заняты другой программой"
call :say "   Закройте AniDesk, проводник и редактор кода, потом повторите запуск"
exit /b 0

rem --- закрываем запущенное приложение, иначе папка out будет заблокирована --
:kill_running
tasklist /fi "imagename eq AniDesk.exe" 2>nul | find /i "AniDesk.exe" >nul 2>nul
if errorlevel 1 exit /b 0
call :warn "AniDesk сейчас запущен и может помешать сборке"
call :ask "Закрыть запущенный AniDesk"
if errorlevel 1 exit /b 0
taskkill /f /im AniDesk.exe >nul 2>nul
call :ok "AniDesk закрыт"
exit /b 0

rem --- секундомер ------------------------------------------------------------
:start_timer
set "T_START="
for /f "tokens=1-3 delims=:.," %%a in ("%TIME: =0%") do set /a "T_START=((1%%a-100)*3600)+((1%%b-100)*60)+(1%%c-100)" 2>nul
exit /b 0

:stop_timer
set "ELAPSED_TEXT="
if not defined T_START exit /b 0
set "T_END="
for /f "tokens=1-3 delims=:.," %%a in ("%TIME: =0%") do set /a "T_END=((1%%a-100)*3600)+((1%%b-100)*60)+(1%%c-100)" 2>nul
if not defined T_END exit /b 0
set /a "T_DIFF=T_END-T_START" 2>nul
if not defined T_DIFF exit /b 0
if !T_DIFF! LSS 0 set /a "T_DIFF=T_DIFF+86400"
set /a "T_MIN=T_DIFF/60"
set /a "T_SEC=T_DIFF%%60"
set "ELAPSED_TEXT=!T_MIN! мин !T_SEC! сек"
exit /b 0
