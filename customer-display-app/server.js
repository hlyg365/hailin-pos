/**
 * 客显屏服务器
 * 提供 HTTP API 接收收银台命令，并支持 SSE 流式推送
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5001;
const HTML_FILE = path.join(__dirname, 'index.html');

// 当前显示内容
let currentDisplay = {
    mode: 'welcome',
    amount: 0,
    qrCode: null
};

// SSE 客户端
let sseClients = [];

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    
    // CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // 健康检查
    if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', mode: currentDisplay.mode }));
        return;
    }
    
    // 获取当前显示状态
    if (url.pathname === '/api/display/current' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(currentDisplay));
        return;
    }
    
    // SSE 流
    if (url.pathname === '/api/display/stream' && req.method === 'GET') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        
        // 添加客户端
        sseClients.push(res);
        console.log(`SSE client connected. Total: ${sseClients.length}`);
        
        // 发送初始状态
        res.write(`data: ${JSON.stringify(currentDisplay)}\n\n`);
        
        // 心跳
        const heartbeat = setInterval(() => {
            res.write(`: heartbeat\n\n`);
        }, 30000);
        
        req.on('close', () => {
            clearInterval(heartbeat);
            sseClients = sseClients.filter(c => c !== res);
            console.log(`SSE client disconnected. Total: ${sseClients.length}`);
        });
        
        return;
    }
    
    // 设置显示内容
    if (url.pathname === '/api/display' && req.method === 'POST') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk;
        });
        
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                
                // 更新显示内容
                currentDisplay = {
                    mode: data.mode || 'welcome',
                    amount: data.amount || 0,
                    qrCode: data.qrCode || data.qr_code || null,
                    customMessage: data.message || null,
                    timestamp: new Date().toISOString()
                };
                
                // 广播到所有 SSE 客户端
                broadcast(currentDisplay);
                
                console.log('Display updated:', currentDisplay.mode);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: 'Display updated',
                    currentMode: currentDisplay.mode
                }));
                
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: 'Invalid request body'
                }));
            }
        });
        
        return;
    }
    
    // 提供 HTML 页面
    if (url.pathname === '/' || url.pathname === '/index.html') {
        fs.readFile(HTML_FILE, (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading page');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(data);
        });
        return;
    }
    
    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
});

// 广播消息到所有 SSE 客户端
function broadcast(data) {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    
    sseClients = sseClients.filter(client => {
        try {
            client.write(message);
            return true;
        } catch (e) {
            console.log('SSE client write error, removing');
            return false;
        }
    });
}

// 启动服务器
server.listen(PORT, () => {
    console.log(`客显屏服务器已启动`);
    console.log(`访问地址: http://localhost:${PORT}`);
    console.log(`API 端点: http://localhost:${PORT}/api/display`);
    console.log('');
    console.log('API 使用示例:');
    console.log(`curl -X POST http://localhost:${PORT}/api/display \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"mode":"welcome"}'`);
    console.log('');
    console.log(`curl -X POST http://localhost:${PORT}/api/display \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"mode":"waiting","amount":99.80}'`);
});

// 处理进程退出
process.on('SIGINT', () => {
    console.log('\n关闭服务器...');
    server.close();
    process.exit(0);
});
