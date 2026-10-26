@echo off
chcp 65001 >nul
title x402 本地天气服务 (Port 3000)

echo ========================================================
echo   [x402] 付费天气 API 本地服务正在启动...
echo ========================================================
echo.

cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js 环境，请确保已安装 Node.js！
    pause
    exit /b 1
)

echo 当前项目路径: %cd%
echo 正在启动 Node.js 服务端 (server/server.js)...
echo.
echo [*] 服务启动后将自动在默认浏览器中打开测试页面！
echo [*] 若要关闭服务，请直接关闭本黑框窗口或按 Ctrl + C。
echo ========================================================
echo.

start "" "http://localhost:3000/health"
node server/server.js

pause
