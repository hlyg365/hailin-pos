/**
 * Cordova 插件桥接 - HailinHardware
 * 版本: v3.0 - 修复Capacitor初始化时序问题
 */

(function() {
    'use strict';
    
    console.log('[Cordova] 初始化 HailinHardware 插件桥接 v3.0...');
    
    // 创建插件对象
    var HailinHardware = {
        
        // ==================== 核心调用方法 ====================
        _callNative: function(method, args) {
            console.log('[HailinHardware] _callNative:', method, args);
            
            return new Promise(function(resolve, reject) {
                var tryCall = function() {
                    // 方式1: 通过 Capacitor.Plugins (最标准方式)
                    if (window.Capacitor && window.Capacitor.Plugins && 
                        window.Capacitor.Plugins.HailinHardware && 
                        typeof window.Capacitor.Plugins.HailinHardware[method] === 'function') {
                        console.log('[HailinHardware] ✓ 使用 Capacitor.Plugins.HailinHardware.' + method);
                        try {
                            var result = window.Capacitor.Plugins.HailinHardware[method](args);
                            if (result && typeof result.then === 'function') {
                                result.then(resolve).catch(reject);
                            } else {
                                resolve(result);
                            }
                        } catch (e) {
                            console.error('[HailinHardware] 调用异常:', e);
                            reject(e);
                        }
                        return true;
                    }
                    
                    // 方式2: 通过 window.HailinHardware (cordova模式)
                    if (window.HailinHardware && typeof window.HailinHardware[method] === 'function' && method !== '_callNative') {
                        console.log('[HailinHardware] ✓ 使用 window.HailinHardware.' + method);
                        // 避免递归调用
                        var result = window.HailinHardware[method](args);
                        if (result && typeof result.then === 'function') {
                            result.then(resolve).catch(reject);
                        } else {
                            resolve(result);
                        }
                        return true;
                    }
                    
                    // 方式3: 通过 Cordova.exec (经典方式)
                    if (window.cordova && window.cordova.exec) {
                        console.log('[HailinHardware] 尝试 cordova.exec...');
                        window.cordova.exec(
                            function(result) { 
                                console.log('[HailinHardware] cordova.exec 成功:', result);
                                resolve(result); 
                            },
                            function(error) { 
                                console.error('[HailinHardware] cordova.exec 失败:', error);
                                reject(error); 
                            },
                            'HailinHardware',
                            method,
                            args
                        );
                        return true;
                    }
                    
                    return false;
                };
                
                // 立即尝试
                if (tryCall()) return;
                
                // 打印调试信息
                console.log('[HailinHardware] 插件未就绪，等待中...');
                console.log('[HailinHardware] 调试信息:');
                console.log('  - window.Capacitor:', typeof window.Capacitor);
                console.log('  - window.Capacitor.Plugins:', typeof window.Capacitor?.Plugins);
                console.log('  - window.Capacitor.Plugins.HailinHardware:', typeof window.Capacitor?.Plugins?.HailinHardware);
                console.log('  - window.HailinHardware:', typeof window.HailinHardware);
                console.log('  - window.cordova:', typeof window.cordova);
                
                // 等待Capacitor初始化后重试
                var retryCount = 0;
                var maxRetries = 30; // 最多等待15秒
                var retryDelay = 500;
                
                var retryInterval = setInterval(function() {
                    retryCount++;
                    console.log('[HailinHardware] 重试 #' + retryCount + '/' + maxRetries);
                    
                    if (tryCall()) {
                        console.log('[HailinHardware] ✓ 重试成功!');
                        clearInterval(retryInterval);
                        return;
                    }
                    
                    // 监听 Capacitor 初始化完成事件
                    if (window.Capacitor && window.Capacitor.isNativeReady && window.Capacitor.isPluginAvailable) {
                        console.log('[HailinHardware] Capacitor 已就绪，尝试获取插件...');
                    }
                    
                    if (retryCount >= maxRetries) {
                        clearInterval(retryInterval);
                        console.error('[HailinHardware] ✗ 超过最大重试次数 (' + maxRetries + ')');
                        console.error('[HailinHardware] 提示: 请确保APP已更新，并且HailinHardwarePlugin已正确注册');
                        reject(new Error('Plugin not available after ' + maxRetries + ' retries'));
                    }
                }, retryDelay);
            });
        },
        
        // ==================== 电子秤方法 ====================
        scaleConnect: function(options, success, fail) {
            console.log('[HailinHardware] scaleConnect 调用:', options);
            var promise = this._callNative('scaleConnect', [options || {}]);
            if (success || fail) {
                promise.then(function(r) { if (success) success(r); })
                       .catch(function(e) { if (fail) fail(e); });
            }
            return promise;
        },
        
        scaleDisconnect: function(options, success, fail) {
            var promise = this._callNative('scaleDisconnect', [options || {}]);
            if (success || fail) {
                promise.then(function(r) { if (success) success(r); })
                       .catch(function(e) { if (fail) fail(e); });
            }
            return promise;
        },
        
        scaleReadWeight: function(options, success, fail) {
            var promise = this._callNative('scaleReadWeight', [options || {}]);
            if (success || fail) {
                promise.then(function(r) { if (success) success(r); })
                       .catch(function(e) { if (fail) fail(e); });
            }
            return promise;
        },
        
        scaleTare: function(options, success, fail) {
            var promise = this._callNative('scaleTare', [options || {}]);
            if (success || fail) {
                promise.then(function(r) { if (success) success(r); })
                       .catch(function(e) { if (fail) fail(e); });
            }
            return promise;
        },
        
        scaleZero: function(options, success, fail) {
            var promise = this._callNative('scaleZero', [options || {}]);
            if (success || fail) {
                promise.then(function(r) { if (success) success(r); })
                       .catch(function(e) { if (fail) fail(e); });
            }
            return promise;
        },
        
        // ==================== 串口枚举 ====================
        listSerialPorts: function(success, fail) {
            var promise = this._callNative('listSerialPorts', [{}]);
            if (success || fail) {
                promise.then(function(r) { if (success) success(r); })
                       .catch(function(e) { if (fail) fail(e); });
            }
            return promise;
        },
        
        detectScale: function(options, success, fail) {
            var promise = this._callNative('detectScale', [options || {}]);
            if (success || fail) {
                promise.then(function(r) { if (success) success(r); })
                       .catch(function(e) { if (fail) fail(e); });
            }
            return promise;
        },
        
        // ==================== 事件监听 ====================
        _listeners: {},
        
        addListener: function(eventName, callback) {
            console.log('[HailinHardware] addListener:', eventName);
            
            if (!this._listeners[eventName]) {
                this._listeners[eventName] = [];
            }
            this._listeners[eventName].push(callback);
            
            // 同时尝试注册到 Capacitor 事件系统
            if (window.Capacitor && window.Capacitor.Plugins && 
                window.Capacitor.Plugins.HailinHardware && 
                typeof window.Capacitor.Plugins.HailinHardware.addListener === 'function') {
                window.Capacitor.Plugins.HailinHardware.addListener(eventName, callback);
            }
            
            return { remove: function() { 
                HailinHardware.removeListener(eventName, callback); 
            }};
        },
        
        removeListener: function(eventName, callback) {
            if (this._listeners[eventName]) {
                var idx = this._listeners[eventName].indexOf(callback);
                if (idx > -1) {
                    this._listeners[eventName].splice(idx, 1);
                }
            }
        },
        
        removeAllListeners: function(eventName) {
            if (eventName) {
                delete this._listeners[eventName];
            } else {
                this._listeners = {};
            }
        },
        
        // 内部方法：触发事件（由原生代码调用）
        _emit: function(eventName, data) {
            console.log('[HailinHardware] _emit:', eventName, data);
            if (this._listeners[eventName]) {
                this._listeners[eventName].forEach(function(cb) {
                    try {
                        cb(data);
                    } catch (e) {
                        console.error('[HailinHardware] 事件回调异常:', e);
                    }
                });
            }
        },
        
        // ==================== 其他硬件方法 ====================
        printerConnect: function(options, success, fail) {
            var promise = this._callNative('printerConnect', [options || {}]);
            if (success || fail) {
                promise.then(function(r) { if (success) success(r); })
                       .catch(function(e) { if (fail) fail(e); });
            }
            return promise;
        },
        
        printerPrintText: function(options, success, fail) {
            var promise = this._callNative('printerPrintText', [options || {}]);
            if (success || fail) {
                promise.then(function(r) { if (success) success(r); })
                       .catch(function(e) { if (fail) fail(e); });
            }
            return promise;
        },
        
        printerCut: function(success, fail) {
            var promise = this._callNative('printerCut', []);
            if (success || fail) {
                promise.then(function(r) { if (success) success(r); })
                       .catch(function(e) { if (fail) fail(e); });
            }
            return promise;
        },
        
        openCashDrawer: function(success, fail) {
            var promise = this._callNative('openCashDrawer', []);
            if (success || fail) {
                promise.then(function(r) { if (success) success(r); })
                       .catch(function(e) { if (fail) fail(e); });
            }
            return promise;
        },
        
        showOnCustomerDisplay: function(options, success, fail) {
            var promise = this._callNative('showOnCustomerDisplay', [options || {}]);
            if (success || fail) {
                promise.then(function(r) { if (success) success(r); })
                       .catch(function(e) { if (fail) fail(e); });
            }
            return promise;
        },
        
        scanBarcode: function(success, fail) {
            var promise = this._callNative('scanBarcode', []);
            if (success || fail) {
                promise.then(function(r) { if (success) success(r); })
                       .catch(function(e) { if (fail) fail(e); });
            }
            return promise;
        }
    };
    
    // 挂载到 window
    window.HailinHardware = HailinHardware;
    console.log('[Cordova] window.HailinHardware 已挂载');
    
    // 通知 Capacitor 插件已加载（如果有的话）
    if (window.Capacitor) {
        console.log('[Cordova] Capacitor 已存在，尝试注册插件...');
        
        // Capacitor 3.x 方式
        if (typeof window.Capacitor.registerPlugin === 'function') {
            try {
                window.Capacitor.registerPlugin('HailinHardware', HailinHardware);
                console.log('[Cordova] ✓ 通过 registerPlugin 注册成功');
            } catch (e) {
                console.error('[Cordova] registerPlugin 失败:', e);
            }
        }
        
        // 尝试挂载到 Capacitor.Plugins
        if (!window.Capacitor.Plugins) {
            window.Capacitor.Plugins = {};
        }
        window.Capacitor.Plugins.HailinHardware = HailinHardware;
        console.log('[Cordova] ✓ 挂载到 Capacitor.Plugins.HailinHardware');
    } else {
        console.log('[Cordova] Capacitor 未初始化，将在首次调用时等待');
    }
    
    // 监听 Capacitor 初始化完成事件
    document.addEventListener('CapacitorPluginsReady', function() {
        console.log('[Cordova] Capacitor 插件就绪事件');
        if (!window.Capacitor.Plugins) {
            window.Capacitor.Plugins = {};
        }
        window.Capacitor.Plugins.HailinHardware = HailinHardware;
    });
    
    // 如果 document 已经加载完成，立即触发
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(function() {
            document.dispatchEvent(new CustomEvent('CordovaDeviceReady'));
        }, 100);
    }
    
})();
