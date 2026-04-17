/**
 * 海邻到家 - Electron 主进程
 * 
 * 功能：
 * - 窗口管理
 * - 硬件通信（电子秤、打印机、钱箱、客显屏）
 * - 分屏显示
 */

const { app, BrowserWindow, ipcMain, Menu, Tray, dialog, nativeImage, screen } = require('electron');
const path = require('path');
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const usb = require('usb');
const escpos = require('escpos');

// 开发模式判断
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// 全局变量
let mainWindow = null;
let customerWindow = null;
let tray = null;
let serialPort = null;
let serialParser = null;

// ============ 窗口管理 ============

function createMainWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  mainWindow = new BrowserWindow({
    width: Math.min(1280, width),
    height: Math.min(800, height),
    minWidth: 1024,
    minHeight: 768,
    title: '海邻到家收银台',
    icon: path.join(__dirname, '../public/icon-192.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    autoHideMenuBar: true,
    backgroundColor: '#1a1a2e',
  });

  // 加载页面
  if (isDev) {
    mainWindow.loadURL('http://localhost:5000');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('[Main] 主窗口已显示');
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  console.log('[Main] 主窗口创建完成');
}

// ============ 客显屏窗口 ============

function createCustomerWindow() {
  const displays = screen.getAllDisplays();
  
  // 找到第二个显示器（如果有）
  const externalDisplay = displays.find((display) => {
    return display.bounds.x !== 0 || display.bounds.y !== 0;
  });

  if (!externalDisplay) {
    console.log('[Customer] 未检测到外接显示器，客显屏模式跳过');
    return null;
  }

  customerWindow = new BrowserWindow({
    width: 400,
    height: 300,
    x: externalDisplay.bounds.x + 50,
    y: externalDisplay.bounds.y + 50,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // 加载客显屏页面
  if (isDev) {
    customerWindow.loadURL('http://localhost:5000/#/customer-display');
  } else {
    customerWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      hash: '/customer-display'
    });
  }

  console.log('[Customer] 客显屏窗口已创建');
  return customerWindow;
}

// ============ 菜单和托盘 ============

function createTray() {
  const iconPath = path.join(__dirname, '../public/icon-192.png');
  
  try {
    tray = new Tray(nativeImage.createFromPath(iconPath));
  } catch (e) {
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
      label: '客显屏',
      submenu: [
        { label: '打开客显屏', click: () => createCustomerWindow() },
        { label: '关闭客显屏', click: () => customerWindow?.close() }
      ]
    },
    { type: 'separator' },
    {
      label: '收银日报',
      click: () => mainWindow?.webContents.send('show-report')
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
        { label: '打开客显屏', click: () => createCustomerWindow() },
        { type: 'separator' },
        { label: '测试小票打印', click: () => mainWindow?.webContents.send('test-receipt-printer') },
        { label: '测试标签打印', click: () => mainWindow?.webContents.send('test-label-printer') },
        { type: 'separator' },
        { label: '打开钱箱', click: () => mainWindow?.webContents.send('open-cash-drawer') }
      ]
    },
    {
      label: '视图',
      submenu: [
        { label: '收银台', click: () => mainWindow?.loadURL(isDev ? 'http://localhost:5000/pos/cashier' : `file://${path.join(__dirname, '../dist/index.html')}#/pos/cashier`) },
        { label: '首页', click: () => mainWindow?.loadURL(isDev ? 'http://localhost:5000/' : `file://${path.join(__dirname, '../dist/index.html')}`) },
        { type: 'separator' },
        { label: '客显屏模式', click: () => createCustomerWindow() }
      ]
    },
    {
      label: '帮助',
      submenu: [
        { label: '硬件诊断', click: () => runHardwareDiagnostics() },
        { type: 'separator' },
        { label: '关于', click: () => dialog.showMessageBox({ 
          title: '关于', 
          message: '海邻到家收银台', 
          detail: `版本: ${app.getVersion()}\nElectron: ${process.versions.electron}\nNode: ${process.versions.node}` 
        }) }
      ]
    }
  ];

  if (isDev) {
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  } else {
    Menu.setApplicationMenu(null);
  }
}

// ============ 硬件诊断 ============

async function runHardwareDiagnostics() {
  const results = {
    scale: { status: 'unknown', detail: '' },
    printers: { status: 'unknown', detail: [] },
    displays: { status: 'unknown', detail: [] },
    usb: { status: 'unknown', detail: [] }
  };

  // 检测串口
  try {
    const ports = await SerialPort.list();
    results.scale = { 
      status: ports.length > 0 ? 'ok' : 'no_device', 
      detail: ports.map(p => p.path).join(', ') || '未找到串口' 
    };
  } catch (e) {
    results.scale = { status: 'error', detail: e.message };
  }

  // 检测 USB 设备
  try {
    const devices = usb.getDeviceList();
    results.usb = { 
      status: 'ok', 
      detail: devices.map(d => `${d.deviceDescriptor.idVendor}:${d.deviceDescriptor.idProduct}`) 
    };
  } catch (e) {
    results.usb = { status: 'error', detail: e.message };
  }

  // 检测显示器
  results.displays = { 
    status: 'ok', 
    detail: screen.getAllDisplays().map((d, i) => `显示器 ${i + 1}: ${d.bounds.width}x${d.bounds.height}`) 
  };

  // 显示诊断结果
  dialog.showMessageBox({
    title: '硬件诊断',
    message: '诊断结果',
    detail: JSON.stringify(results, null, 2)
  });
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
      const reading = parseScaleData(data);
      if (reading) {
        mainWindow?.webContents.send('scale-data', reading);
        customerWindow?.webContents.send('scale-data', reading);
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
    // 通用格式
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

// ============ 打印服务 ============

async function printReceipt(commands) {
  try {
    // 查找打印机
    const devices = await SerialPort.list();
    const printerPort = devices.find(d => d.manufacturer?.includes('Printer') || d.path.includes('USB'));
    
    if (printerPort) {
      const printer = new SerialPort({
        path: printerPort.path,
        baudRate: 9600
      });
      
      printer.write(Buffer.from(commands), (err) => {
        if (err) console.error('[Printer] 打印失败:', err);
        printer.close();
      });
    } else {
      console.log('[Printer] 未找到打印机，模拟打印');
    }
    return { success: true };
  } catch (err) {
    console.error('[Printer] 打印错误:', err);
    return { success: false, error: err.message };
  }
}

async function printLabel(commands) {
  // 标签打印逻辑
  console.log('[LabelPrinter] 标签打印指令:', commands);
  return { success: true };
}

// ============ 钱箱控制 ============

async function openCashDrawer(commands) {
  try {
    // 通过打印机打开钱箱（如果钱箱连接到打印机）
    console.log('[CashDrawer] 打开钱箱');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ============ 客显屏 ============

function updateCustomerDisplay(data) {
  if (customerWindow) {
    customerWindow.webContents.send('display-update', data);
  }
}

// ============ 分屏 ============

function getDisplays() {
  return screen.getAllDisplays().map((display, index) => ({
    id: index,
    name: `显示器 ${index + 1}`,
    bounds: display.bounds,
    isPrimary: display.bounds.x === 0 && display.bounds.y === 0
  }));
}

// ============ AI 识别 ============

async function aiRecognize(imageBase64) {
  try {
    const http = require('http');
    
    const postData = JSON.stringify({ image: imageBase64 });
    
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/recognize',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    return new Promise((resolve) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({ status: 'failed', error: '解析失败' });
          }
        });
      });
      
      req.on('error', () => {
        resolve({ status: 'failed', error: 'AI 服务未连接' });
      });
      
      req.write(postData);
      req.end();
    });
  } catch (err) {
    return { status: 'failed', error: err.message };
  }
}

// ============ IPC 通信 ============

function setupIPC() {
  // 串口
  ipcMain.handle('serial:list', listSerialPorts);
  ipcMain.handle('serial:connect', async (event, portPath, options) => {
    try { return await connectScale(portPath, options); }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('serial:disconnect', async () => { await disconnectScale(); return { success: true }; });
  ipcMain.handle('serial:write', async (event, data) => {
    if (serialPort && serialPort.isOpen) { serialPort.write(data); return { success: true }; }
    return { success: false, error: '串口未连接' };
  });

  // 打印
  ipcMain.handle('print:receipt', async (event, commands) => printReceipt(commands));
  ipcMain.handle('print:label', async (event, commands) => printLabel(commands));

  // 钱箱
  ipcMain.handle('cashDrawer:open', async (event, commands) => openCashDrawer(commands));

  // 客显屏
  ipcMain.handle('customerDisplay:update', (event, data) => updateCustomerDisplay(data));
  ipcMain.handle('customerDisplay:init', () => {
    createCustomerWindow();
    return { success: true };
  });

  // 分屏
  ipcMain.handle('display:getAll', () => getDisplays());
  ipcMain.handle('display:openCustomer', () => {
    createCustomerWindow();
    return { success: true };
  });
  ipcMain.handle('display:closeCustomer', () => {
    customerWindow?.close();
    return { success: true };
  });

  // AI
  ipcMain.handle('ai:recognize', async (event, imageBase64) => aiRecognize(imageBase64));

  // 应用信息
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
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  ipcMain.on('window:close', () => mainWindow?.hide());
  ipcMain.on('window:fullscreen', () => mainWindow?.setFullScreen(!mainWindow?.isFullScreen()));

  // 硬件诊断
  ipcMain.handle('hardware:diagnostics', runHardwareDiagnostics);

  console.log('[Main] IPC 通信已设置');
}

// ============ 应用生命周期 ============

app.whenReady().then(() => {
  console.log('[Main] 应用启动');
  console.log('[Main] 平台:', process.platform);

  setupIPC();
  createMenu();
  createMainWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
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
  customerWindow?.close();
  console.log('[Main] 应用退出');
});

process.on('uncaughtException', (error) => {
  console.error('[Main] 未捕获异常:', error);
  dialog.showErrorBox('错误', error.message);
});
