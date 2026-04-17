#!/bin/bash
# 生产环境启动脚本
# 由于部署环境 /opt/bytefaas 是只读的，使用 /tmp 作为工作目录

# 找到应用目录
if [ -d "/opt/bytefaas/apps/pos-app/dist" ]; then
    APP_DIR="/opt/bytefaas/apps/pos-app"
elif [ -d "/workspace/projects/apps/pos-app/dist" ]; then
    APP_DIR="/workspace/projects/apps/pos-app"
else
    # 查找 dist 目录
    APP_DIR=$(find / -name "pos-app" -type d 2>/dev/null | grep -E "(opt|workspace)" | head -1)
fi

if [ -z "$APP_DIR" ] || [ ! -d "$APP_DIR/dist" ]; then
    echo "Error: Cannot find dist directory"
    exit 1
fi

echo "Using app directory: $APP_DIR"

# 在 /tmp 创建工作目录
WORK_DIR="/tmp/pos-app-serve"
rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR"

# 复制静态文件
cp -r "$APP_DIR/dist/"* "$WORK_DIR/"

echo "Starting server on port 5000..."

# 启动 Node.js 静态文件服务器
cd "$WORK_DIR"
node -e "
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const ROOT = '$WORK_DIR';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.manifest': 'application/json',
};

const server = http.createServer((req, res) => {
  let url = req.url.split('?')[0];
  
  // 解码 URL
  url = decodeURIComponent(url);
  
  // 移除开头的斜杠
  url = url.replace(/^\/+/, '');
  
  let filePath = path.join(ROOT, url || 'index.html');
  
  // 如果是目录，尝试 index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }
  
  // SPA fallback: 所有路由都返回 index.html
  if (!fs.existsSync(filePath)) {
    filePath = path.join(ROOT, 'index.html');
  }
  
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600'
    });
    res.end(content);
  } catch (err) {
    console.error('Error serving:', url, err.message);
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('海邻到家服务已启动: http://localhost:' + PORT);
});
"
