/**
 * 海邻到家 - Electron 预加载脚本
 * 
 * 在上下文中暴露安全的 API 给前端
 */

const { contextBridge, ipcRenderer } = require('electron');

// 暴露给前端的 API
contextBridge.exposeInMainWorld('electronAPI', {
  // ============ 硬件相关 ============
  
  /**
   * 列出可用串口
   * @returns {Promise<Array>} 串口列表
   */
  listSerialPorts: () => ipcRenderer.invoke('serial:list'),

  /**
   * 连接电子秤
   * @param {string} portPath 串口路径
   * @param {object} options 串口配置
   * @returns {Promise<object>} 连接结果
   */
  connectScale: (portPath, options) => ipcRenderer.invoke('serial:connect', portPath, options),

  /**
   * 断开电子秤
   * @returns {Promise<object>} 操作结果
   */
  disconnectScale: () => ipcRenderer.invoke('serial:disconnect'),

  /**
   * 发送数据到串口
   * @param {string} data 数据
   * @returns {Promise<object>} 操作结果
   */
  serialWrite: (data) => ipcRenderer.invoke('serial:write', data),

  /**
   * 监听电子秤数据
   * @param {function} callback 回调函数
   */
  onScaleData: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('scale-data', handler);
    return () => ipcRenderer.removeListener('scale-data', handler);
  },

  /**
   * 监听电子秤连接状态
   */
  onScaleConnected: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('scale-connected', handler);
    return () => ipcRenderer.removeListener('scale-connected', handler);
  },

  /**
   * 监听电子秤断开
   */
  onScaleDisconnected: (callback) => {
    const handler = (event) => callback();
    ipcRenderer.on('scale-disconnected', handler);
    return () => ipcRenderer.removeListener('scale-disconnected', handler);
  },

  /**
   * 监听电子秤错误
   */
  onScaleError: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('scale-error', handler);
    return () => ipcRenderer.removeListener('scale-error', handler);
  },

  // ============ 应用相关 ============

  /**
   * 获取应用信息
   * @returns {Promise<object>} 应用信息
   */
  getAppInfo: () => ipcRenderer.invoke('app:info'),

  // ============ 窗口控制 ============

  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  toggleFullscreen: () => ipcRenderer.send('window:fullscreen'),

  // ============ 事件监听 ============

  /**
   * 显示日报
   */
  onShowReport: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('show-report', handler);
    return () => ipcRenderer.removeListener('show-report', handler);
  },

  /**
   * 连接电子秤（菜单触发）
   */
  onConnectScale: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('connect-scale', handler);
    return () => ipcRenderer.removeListener('connect-scale', handler);
  },

  /**
   * 测试摄像头（菜单触发）
   */
  onTestCamera: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('test-camera', handler);
    return () => ipcRenderer.removeListener('test-camera', handler);
  },
});

// 控制台提示
console.log('[Preload] Electron API 已加载');
