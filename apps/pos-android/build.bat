@echo off
chcp 65001 >nul
echo ==============================================
echo    海邻到家收银台 - Android APK 打包工具
echo ==============================================
echo.

REM 设置项目根目录
set PROJECT_ROOT=%~dp0
cd /d "%PROJECT_ROOT%"

REM 检查 Java
java -version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Java，请先安装 JDK 11+
    echo 下载地址: https://adoptium.net/
    pause
    exit /b 1
)

REM 检查 Android SDK
if not exist "%ANDROID_HOME%\platforms" (
    echo [警告] 未检测到 Android SDK
    echo 请设置 ANDROID_HOME 环境变量指向 SDK 目录
    echo.
    echo 或者在 Android Studio 中打开: apps\pos-android\android
    pause
)

echo [1/5] 检查前端构建...
if not exist "..\pos-app\dist" (
    echo     前端未构建，开始构建...
    cd ..\pos-app
    call pnpm install
    call pnpm build
    cd ..\%~dp0
)

echo [2/5] 同步 Capacitor...
call npx cap sync android --no-interactive

echo [3/5] 同步 Web 资源...
call npx cap copy android --no-interactive

echo [4/5] 构建 APK...
cd android
call gradlew assembleDebug --no-daemon

if errorlevel 1 (
    echo [错误] Gradle 构建失败
    cd ..
    pause
    exit /b 1
)

cd ..

echo [5/5] 完成！
echo.
echo ==============================================
echo APK 文件位置:
for /r %%i in (android\app\build\outputs\apk\debug\*.apk) do (
    echo %%i
)
echo ==============================================
echo.
echo 安装方式:
echo   1. 将 APK 复制到 U盘，插入一体机安装
echo   2. 使用 ADB 安装: adb install -r android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo ADB 连接一体机:
echo   adb connect ^<一体机IP^>:5555
echo   adb install -r android\app\build\outputs\apk\debug\app-debug.apk
echo.
pause
