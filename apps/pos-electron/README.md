# 海邻到家收银台 - Electron 桌面版

## 功能特性

| 功能 | Web 版 | Electron 版 |
|------|--------|-------------|
| 浏览器运行 | ✅ | ✅ |
| 硬件调用 | ⚠️ 不稳定 | ✅ 完美 |
| 电子秤串口 | ❌ 不可用 | ✅ 支持 |
| 摄像头 | ⚠️ 不稳定 | ✅ 完美 |
| 离线缓存 | ✅ | ✅ |
| 系统托盘 | ❌ | ✅ |
| 本地 AI 服务 | ⚠️ 需配置 | ✅ 内置 |

## 系统要求

- **Windows**: Windows 10/11 (64-bit)
- **Linux**: Ubuntu 18.04+ / CentOS 7+
- **macOS**: macOS 10.15+
- **内存**: 4GB+
- **硬盘**: 500MB+

## 安装步骤

### 方式一：下载安装包（推荐）

1. 下载最新版本：
   - Windows: `海邻到家收银台-Setup-x.x.x.exe`
   - Linux: `海邻到家收银台-x.x.x.AppImage`
   - macOS: `海邻到家收银台-x.x.x.dmg`

2. 运行安装程序，按提示完成安装

3. 启动应用

### 方式二：从源码构建

#### 1. 克隆项目
```bash
git clone <repo-url>
cd <project-dir>
```

#### 2. 安装依赖
```bash
# 安装前端依赖
cd apps/pos-app
pnpm install

# 构建前端
pnpm build

# 安装 Electron 依赖
cd ../pos-electron
npm install
```

#### 3. 开发模式
```bash
npm run dev
```

#### 4. 构建安装包
```bash
# Windows
npm run build:win

# Linux
npm run build:linux

# macOS
npm run build:mac
```

## 硬件连接

### 电子秤

支持协议：
- 通用串口协议 (9600, 8N1)
- CAS 秤协议
- 上海耀华协议

接线：
```
秤 (DB9/RS232)     USB转串口
┌─────────┐        ┌─────────┐
│  2 TX   │ ──────►│   USB   │
│  3 RX   │ ◄─────│         │
│  5 GND  │ ──────│         │
└─────────┘        └─────────┘
```

连接后，应用会自动检测并连接。

### 摄像头

推荐配置：
- USB 3.0 摄像头
- 1080P 分辨率
- 自动对焦

## 目录结构

```
pos-electron/
├── main.js           # Electron 主进程
├── preload.js        # 预加载脚本（安全桥接）
├── package.json     # 项目配置
└── README.md        # 本文档

apps/pos-app/
├── dist/             # 前端构建产物
├── ai-service/       # AI 服务（内置）
└── public/          # 静态资源
```

## 故障排除

### 电子秤无法连接

1. 检查 USB 转串口驱动
2. 确认串口线连接正常
3. 核实波特率设置（通常 9600）
4. 查看日志输出

### 摄像头无法打开

1. 确保摄像头未被其他程序占用
2. 检查 USB 连接
3. 允许浏览器/应用访问摄像头

### 应用白屏

1. 检查网络连接
2. 清除缓存后重试
3. 查看控制台错误

## 技术支持

联系海邻到家技术支持团队获取帮助。
