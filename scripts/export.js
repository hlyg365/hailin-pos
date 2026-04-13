const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'out');
const buildDir = path.join(__dirname, '..', '.next', 'server', 'app');

// 确保输出目录存在
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 递归复制目录
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.log('Source not found:', src);
    return;
  }
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 创建主入口 HTML
const indexHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="#FF6B35">
  <title>海邻到家</title>
</head>
<body>
  <div id="__next">
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#FF6B35;color:white;font-family:system-ui;">
      <div style="text-align:center;">
        <div style="font-size:32px;margin-bottom:16px;">🏪</div>
        <div style="font-size:18px;">正在加载...</div>
      </div>
    </div>
  </div>
  <script>
    window.location.replace('/pos/index/');
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, 'index.html'), indexHtml);

// 复制构建产物
console.log('Copying build artifacts from', buildDir, 'to', outDir);
copyDirRecursive(buildDir, outDir);

// 复制静态文件
const staticDir = path.join(__dirname, '..', '.next', 'static');
const outStaticDir = path.join(outDir, '_next', 'static');
if (fs.existsSync(staticDir)) {
  console.log('Copying static files...');
  copyDirRecursive(staticDir, outStaticDir);
}

console.log('Export completed!');
console.log('Output directory:', outDir);
