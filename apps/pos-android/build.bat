@echo off
chcp 65001 >nul
title 海邻到家收银台 - APK打包工具

:START
cls
echo ==============================================
echo.
echo      海邻到家收银台 APK 打包工具
echo.
echo ==============================================
echo.
echo 本工具将帮助您完成以下工作:
echo   1. 检查开发环境
echo   2. 构建前端应用
echo   3. 同步到 Android 项目
echo   4. 打包 APK
echo.
echo ==============================================
echo.

REM 检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js
    echo.
    echo 请先安装 Node.js:
    echo 下载地址: https://nodejs.org/
    echo 请下载 LTS 版本 (左侧绿色按钮)
    echo.
    pause
    exit /b 1
)

REM 检查 Java
java -version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Java JDK
    echo.
    echo 请先安装 JDK 11 或 17:
    echo 下载地址: https://adoptium.net/
    echo.
    pause
    exit /b 1
)

REM 检查 Android SDK
if not exist "%ANDROID_HOME%\platforms" (
    if not exist "%LOCALAPPDATA%\Android\Sdk\platforms" (
        echo [警告] 未检测到 Android SDK
        echo.
        echo 请先安装 Android Studio:
        echo 下载地址: https://developer.android.com/studio
        echo.
        echo 或者手动设置 ANDROID_HOME 环境变量
        echo.
        pause
        exit /b 1
    ) else (
        set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
    )
)

echo [OK] Node.js: 
node --version
echo [OK] Java: 
java -version 2>&1 | findstr /i "version"
echo [OK] Android SDK: %ANDROID_HOME%
echo.

REM 设置项目路径
set PROJECT_ROOT=%~dp0
cd /d "%PROJECT_ROOT%"

:CHOICE
echo 请选择操作:
echo.
echo   1. 构建 Debug APK (测试版)
echo   2. 构建 Release APK (正式版)
echo   3. 仅同步 Web 资源
echo   4. 打开 Android Studio
echo   5. 查看 APK 位置
echo   0. 退出
echo.
set /p choice=请输入选项 (0-5): 

if "%choice%"=="1" goto BUILD_DEBUG
if "%choice%"=="2" goto BUILD_RELEASE
if "%choice%"=="3" goto SYNC_ONLY
if "%choice%"=="4" goto OPEN_AS
if "%choice%"=="5" goto SHOW_APK
if "%choice%"=="0" exit
goto CHOICE

:BUILD_DEBUG
echo.
echo ==============================================
echo [1/4] 正在构建前端...
echo ==============================================
cd /d "%PROJECT_ROOT%\..\pos-app"
call pnpm build
if errorlevel 1 (
    echo [错误] 前端构建失败
    pause
    goto START
)

echo.
echo ==============================================
echo [2/4] 正在同步到 Android...
echo ==============================================
cd /d "%PROJECT_ROOT%"
call npx cap sync android --no-interactive
if errorlevel 1 (
    echo [错误] 同步失败
    pause
    goto START
)

echo.
echo ==============================================
echo [3/4] 正在编译 APK (这可能需要几分钟)...
echo ==============================================
cd /d "%PROJECT_ROOT%\android"

REM 清理并构建
call gradlew.bat clean assembleDebug --no-daemon

if errorlevel 1 (
    echo.
    echo [错误] APK 构建失败
    echo.
    echo 常见问题:
    echo   - 检查 Gradle 同步是否成功
    echo   - 确保 Android SDK 安装正确
    echo   - 查看上方错误信息
    echo.
    pause
    goto START
)

echo.
echo ==============================================
echo [4/4] 构建完成!
echo ==============================================
echo.
echo APK 文件位置:
dir /s /b "%PROJECT_ROOT%\android\app\build\outputs\apk\debug\*.apk" 2>nul
echo.
echo 下一步:
echo   1. 将 APK 复制到 U盘
echo   2. 插入一体机安装
echo.
echo 或使用 ADB 安装:
echo   adb install -r "%PROJECT_ROOT%\android\app\build\outputs\apk\debug\app-debug.apk"
echo.
pause
goto START

:BUILD_RELEASE
echo.
echo [提示] Release 版本需要签名配置
echo 请先在 android/app/build.gradle 中配置签名信息
echo.
echo 按任意键继续构建 Debug 版本...
pause >nul
goto BUILD_DEBUG

:SYNC_ONLY
echo.
echo ==============================================
echo 正在同步 Web 资源...
echo ==============================================
cd /d "%PROJECT_ROOT%"
call npx cap sync android --no-interactive
call npx cap copy android --no-interactive
echo.
echo 同步完成!
echo.
pause
goto START

:OPEN_AS
echo.
echo 正在打开 Android Studio...
echo 如果未安装 Android Studio，请下载:
echo https://developer.android.com/studio
echo.
start "" "%ANDROID_HOME%\bin\studio64.exe"
goto START

:SHOW_APK
echo.
echo ==============================================
echo APK 文件位置:
echo ==============================================
echo.
echo Debug 版本:
dir /s /b "%PROJECTROOT%\android\app\build\outputs\apk\debug\*.apk" 2>nul
if errorlevel 1 (
    echo   尚未构建，请先执行打包
)
echo.
echo.
pause
goto START
