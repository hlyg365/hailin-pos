/**
 * 海邻到家 - Electron 主进程
 * 
 * 功能：
 * - 窗口管理
 * - 硬件通信（摄像头、串口）
 * - 系统集成（托盘、菜单）
 */

const { app, BrowserWindow, ipcMain, Menu, Tray, dialog, nativeImage } = require('electron');
const path = require('path');
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

// 开发模式判断
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// 全局变量
let mainWindow = null;
let tray = null;
let serialPort = null;
let serialParser = null;

// ============ 窗口管理 ============

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: '海邻到家收银台',
    icon: path.join(__dirname, '../public/icon-192.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    // 全屏/ kiosk 模式（适合一体机）
    kiosk: false,
    autoHideMenuBar: true,
  });

  // 加载页面
  if (isDev) {
    mainWindow.loadURL('http://localhost:5000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 窗口事件
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 准备好显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('[Main] 窗口已显示');
  });

  // 阻止关闭，最小化到托盘
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  console.log('[Main] 窗口创建完成');
}

// ============ 菜单和托盘 ============

function createTray() {
  const iconPath = path.join(__dirname, '../public/icon-192.png');
  
  try {
    tray = new Tray(nativeImage.createFromPath(iconPath));
  } catch (e) {
    // 使用空白图标
    tray = new Tray(nativeImage.createEmpty());
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示收银台',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: '收银日报',
      click: () => {
        mainWindow?.webContents.send('show-report');
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('海邻到家收银台');
  tray.setContextMenu(contextMenu);
  
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  console.log('[Main] 托盘创建完成');
}

function createMenu() {
  const template = [
    {
      label: '收银台',
      submenu: [
        { label: '刷新', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.reload() },
        { label: '全屏', accelerator: 'F11', click: () => mainWindow?.setFullScreen(!mainWindow?.isFullScreen()) },
        { type: 'separator' },
        { label: '退出', accelerator: 'CmdOrCtrl+Q', click: () => { app.isQuitting = true; app.quit(); } }
      ]
    },
    {
      label: '硬件',
      submenu: [
        { label: '连接电子秤', click: () => mainWindow?.webContents.send('connect-scale') },
        { label: '断开电子秤', click: () => disconnectScale() },
        { type: 'separator' },
        { label: '测试摄像头', click: () => mainWindow?.webContents.send('test-camera') }
      ]
    },
    {
      label: '帮助',
      submenu: [
        { label: '关于', click: () => dialog.showMessageBox({ title: '关于', message: '海邻到家收银台 v1.0.0' }) }
      ]
    }
  ];

  // 仅在开发模式显示完整菜单
  if (isDev) {
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  } else {
    Menu.setApplicationMenu(null);
  }
}

// ============ 串口通信（电子秤） ============

async function listSerialPorts() {
  try {
    const ports = await SerialPort.list();
    console.log('[Serial] 可用串口:', ports.map(p => p.path));
    return ports.map(p => ({
      path: p.path,
      manufacturer: p.manufacturer,
      serialNumber: p.serialNumber,
      vendorId: p.vendorId,
      productId: p.productId
    }));
  } catch (err) {
    console.error('[Serial] 列出串口失败:', err);
    return [];
  }
}

async function connectScale(portPath, options = {}) {
  if (serialPort && serialPort.isOpen) {
    console.log('[Serial] 已有连接，先断开');
    await disconnectScale();
  }

  const config = {
    path: portPath,
    baudRate: options.baudRate || 9600,
    dataBits: options.dataBits || 8,
    parity: options.parity || 'none',
    stopBits: options.stopBits || 1,
    timeout: 1000,
  };

  return new Promise((resolve, reject) => {
    serialPort = new SerialPort(config);

    serialParser = serialPort.pipe(new Readline({ delimiter: '\r\n' }));

    serialPort.on('open', () => {
      console.log('[Serial] 串口已打开:', portPath);
      mainWindow?.webContents.send('scale-connected', { port: portPath });
      resolve({ success: true, port: portPath });
    });

    serialParser.on('data', (data) => {
      console.log('[Serial] 收到数据:', data);
      const reading = parseScaleData(data);
      if (reading) {
        mainWindow?.webContents.send('scale-data', reading);
      }
    });

    serialPort.on('close', () => {
      console.log('[Serial] 串口已关闭');
      mainWindow?.webContents.send('scale-disconnected');
    });

    serialPort.on('error', (err) => {
      console.error('[Serial] 串口错误:', err);
      mainWindow?.webContents.send('scale-error', { message: err.message });
      reject(err);
    });
  });
}

function disconnectScale() {
  return new Promise((resolve) => {
    if (serialPort && serialPort.isOpen) {
      serialPort.close((err) => {
        if (err) console.error('[Serial] 关闭失败:', err);
        serialPort = null;
        serialParser = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

function parseScaleData(data) {
  try {
    const str = data.toString().trim();
    // 通用格式: "+01.250kg" 或 "01.250 kg"
    const match = str.match(/^([+-]?)(\d+\.?\d*)\s*kg$/i);
    if (match) {
      const sign = match[1] === '-' ? -1 : 1;
      return {
        weight: parseFloat(match[2]) * sign,
        unit: 'kg',
        stable: !str.startsWith('S') && !str.startsWith('U'),
        raw: str
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}

// ============ IPC 通信 ============

function setupIPC() {
  // 列出串口
  ipcMain.handle('serial:list', listSerialPorts);

  // 连接电子秤
  ipcMain.handle('serial:connect', async (event, portPath, options) => {
    try {
      return await connectScale(portPath, options);
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // 断开电子秤
  ipcMain.handle('serial:disconnect', async () => {
    await disconnectScale();
    return { success: true };
  });

  // 发送数据到串口
  ipcMain.handle('serial:write', async (event, data) => {
    if (serialPort && serialPort.isOpen) {
      serialPort.write(data);
      return { success: true };
    }
    return { success: false, error: '串口未连接' };
  });

  // 获取应用信息
  ipcMain.handle('app:info', () => ({
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
    electron: process.versions.electron,
    node: process.versions.node,
  }));

  // 窗口控制
  ipcMain.on('window:minimize', () => mainWindow?.minimize());
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window:close', () => mainWindow?.hide());
  ipcMain.on('window:fullscreen', () => mainWindow?.setFullScreen(!mainWindow?.isFullScreen()));

  console.log('[Main] IPC 通信已设置');
}

// ============ 应用生命周期 ============

app.whenReady().then(() => {
  console.log('[Main] 应用启动');
  console.log('[Main] 平台:', process.platform);
  console.log('[Main] Electron:', process.versions.electron);

  setupIPC();
  createMenu();
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  app.isQuitting = true;
  await disconnectScale();
  console.log('[Main] 应用退出');
});

// 捕获未处理的错误
process.on('uncaughtException', (error) => {
  console.error('[Main] 未捕获异常:', error);
  dialog.showErrorBox('错误', error.message);
});
