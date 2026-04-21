/**
 * Cordova 插件桥接 - HailinHardware
 * 用于 Capacitor 应用加载原生硬件插件
 */

(function() {
    'use strict';
    
    console.log('[Cordova] 初始化 HailinHardware 插件桥接...');
    
    // 确保 cordova 对象存在
    if (!window.cordova) {
        window.cordova = {
            exec: function(success, fail, service, action, args) {
                console.log('[Cordova] exec:', service, action, args);
                // 尝试通过 Capacitor Bridge 调用
                if (window.Capacitor && window.Capacitor.nativeCallback) {
                    var result = window.Capacitor.nativeCallback(service, action, args);
                    if (success && result) {
                        success(result);
                    }
                } else {
                    console.warn('[Cordova] Capacitor Bridge 不可用');
                    if (fail) fail('Plugin not available');
                }
            }
        };
    }
    
    // 注册 HailinHardware 插件
    var HailinHardware = {
        // 电子秤
        scaleConnect: function(options, success, fail) {
            cordova.exec(success, fail, 'HailinHardware', 'scaleConnect', [options]);
        },
        scaleDisconnect: function(options, success, fail) {
            cordova.exec(success, fail, 'HailinHardware', 'scaleDisconnect', options ? [options] : [{}]);
        },
        scaleReadWeight: function(options, success, fail) {
            cordova.exec(success, fail, 'HailinHardware', 'scaleReadWeight', options ? [options] : [{}]);
        },
        scaleTare: function(options, success, fail) {
            cordova.exec(success, fail, 'HailinHardware', 'scaleTare', options ? [options] : [{}]);
        },
        scaleZero: function(options, success, fail) {
            cordova.exec(success, fail, 'HailinHardware', 'scaleZero', options ? [options] : [{}]);
        },
        
        // 打印机
        printerConnect: function(options, success, fail) {
            cordova.exec(success, fail, 'HailinHardware', 'printerConnect', [options]);
        },
        printerPrintText: function(options, success, fail) {
            cordova.exec(success, fail, 'HailinHardware', 'printerPrintText', [options]);
        },
        printerNewLine: function(options, success, fail) {
            cordova.exec(success, fail, 'HailinHardware', 'printerNewLine', options ? [options] : [{}]);
        },
        printerCut: function(options, success, fail) {
            cordova.exec(success, fail, 'HailinHardware', 'printerCut', options ? [options] : [{}]);
        },
        printerDisconnect: function(success, fail) {
            cordova.exec(success, fail, 'HailinHardware', 'printerDisconnect', [{}]);
        },
        
        // 钱箱
        openCashDrawer: function(options, success, fail) {
            cordova.exec(success, fail, 'HailinHardware', 'openCashDrawer', options ? [options] : [{}]);
        },
        
        // 客显屏
        showOnCustomerDisplay: function(options, success, fail) {
            cordova.exec(success, fail, 'HailinHardware', 'showOnCustomerDisplay', [options]);
        },
        dismissCustomerDisplay: function(success, fail) {
            cordova.exec(success, fail, 'HailinHardware', 'dismissCustomerDisplay', [{}]);
        },
        
        // 扫码
        enableBarcodeScanner: function(success, fail) {
            cordova.exec(success, fail, 'HailinHardware', 'enableBarcodeScanner', [{}]);
        },
        disableBarcodeScanner: function(success, fail) {
            cordova.exec(success, fail, 'HailinHardware', 'disableBarcodeScanner', [{}]);
        },
        
        // 事件监听
        addListener: function(eventName, callback) {
            console.log('[HailinHardware] addListener:', eventName);
            // 存储回调
            if (!HailinHardware._listeners) {
                HailinHardware._listeners = {};
            }
            if (!HailinHardware._listeners[eventName]) {
                HailinHardware._listeners[eventName] = [];
            }
            HailinHardware._listeners[eventName].push(callback);
            
            // 返回移除函数
            return {
                remove: function() {
                    if (HailinHardware._listeners && HailinHardware._listeners[eventName]) {
                        var idx = HailinHardware._listeners[eventName].indexOf(callback);
                        if (idx > -1) {
                            HailinHardware._listeners[eventName].splice(idx, 1);
                        }
                    }
                }
            };
        },
        removeListener: function(eventName, callback) {
            if (HailinHardware._listeners && HailinHardware._listeners[eventName]) {
                var idx = HailinHardware._listeners[eventName].indexOf(callback);
                if (idx > -1) {
                    HailinHardware._listeners[eventName].splice(idx, 1);
                }
            }
        },
        removeAllListeners: function(eventName) {
            if (eventName && HailinHardware._listeners) {
                delete HailinHardware._listeners[eventName];
            }
        },
        
        // 内部方法：触发事件（由原生代码调用）
        _fireEvent: function(eventName, data) {
            console.log('[HailinHardware] _fireEvent:', eventName, data);
            if (HailinHardware._listeners && HailinHardware._listeners[eventName]) {
                HailinHardware._listeners[eventName].forEach(function(callback) {
                    try {
                        callback(data);
                    } catch (e) {
                        console.error('[HailinHardware] 事件回调异常:', e);
                    }
                });
            }
        }
    };
    
    // 挂载到 window
    window.HailinHardware = HailinHardware;
    
    // 同时挂载到 Capacitor.Plugins
    if (window.Capacitor) {
        if (!window.Capacitor.Plugins) {
            window.Capacitor.Plugins = {};
        }
        window.Capacitor.Plugins.HailinHardware = HailinHardware;
        console.log('[Cordova] HailinHardware 已注册到 Capacitor.Plugins');
    }
    
    console.log('[Cordova] HailinHardware 插件桥接初始化完成');
    
})();
