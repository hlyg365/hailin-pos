/**
 * Cordova 插件桥接 - HailinHardware
 * 支持 Promise 和回调两种调用模式
 */

(function() {
    'use strict';
    
    console.log('[Cordova] 初始化 HailinHardware 插件桥接...');
    
    // 注册 HailinHardware 插件到 window
    var HailinHardware = {
        // 电子秤 - 同时支持 Promise 和回调模式
        scaleConnect: function(options, success, fail) {
            // 模式1: Promise 模式 (参数是对象，没有回调)
            if (typeof options === 'object' && !success && !fail) {
                console.log('[HailinHardware] scaleConnect (Promise模式):', options);
                return window.HailinHardware._callNative('scaleConnect', [options]);
            }
            // 模式2: 回调模式 (有回调函数)
            console.log('[HailinHardware] scaleConnect (回调模式):', options);
            window.HailinHardware._callNative('scaleConnect', [options])
                .then(function(result) {
                    if (success) success(result);
                })
                .catch(function(error) {
                    if (fail) fail(error);
                });
        },
        
        scaleDisconnect: function(options, success, fail) {
            if (typeof options === 'object' && !success && !fail) {
                return window.HailinHardware._callNative('scaleDisconnect', options ? [options] : [{}]);
            }
            window.HailinHardware._callNative('scaleDisconnect', options ? [options] : [{}])
                .then(function(result) { if (success) success(result); })
                .catch(function(error) { if (fail) fail(error); });
        },
        
        scaleReadWeight: function(options, success, fail) {
            if (typeof options === 'object' && !success && !fail) {
                return window.HailinHardware._callNative('scaleReadWeight', options ? [options] : [{}]);
            }
            window.HailinHardware._callNative('scaleReadWeight', options ? [options] : [{}])
                .then(function(result) { if (success) success(result); })
                .catch(function(error) { if (fail) fail(error); });
        },
        
        scaleTare: function(options, success, fail) {
            if (typeof options === 'object' && !success && !fail) {
                return window.HailinHardware._callNative('scaleTare', options ? [options] : [{}]);
            }
            window.HailinHardware._callNative('scaleTare', options ? [options] : [{}])
                .then(function(result) { if (success) success(result); })
                .catch(function(error) { if (fail) fail(error); });
        },
        
        scaleZero: function(options, success, fail) {
            if (typeof options === 'object' && !success && !fail) {
                return window.HailinHardware._callNative('scaleZero', options ? [options] : [{}]);
            }
            window.HailinHardware._callNative('scaleZero', options ? [options] : [{}])
                .then(function(result) { if (success) success(result); })
                .catch(function(error) { if (fail) fail(error); });
        },
        
        // 打印机
        printerConnect: function(options, success, fail) {
            if (typeof options === 'object' && !success && !fail) {
                return window.HailinHardware._callNative('printerConnect', [options]);
            }
            window.HailinHardware._callNative('printerConnect', [options])
                .then(function(result) { if (success) success(result); })
                .catch(function(error) { if (fail) fail(error); });
        },
        
        printerPrintText: function(options, success, fail) {
            if (typeof options === 'object' && !success && !fail) {
                return window.HailinHardware._callNative('printerPrintText', [options]);
            }
            window.HailinHardware._callNative('printerPrintText', [options])
                .then(function(result) { if (success) success(result); })
                .catch(function(error) { if (fail) fail(error); });
        },
        
        printerNewLine: function(options, success, fail) {
            if (typeof options === 'object' && !success && !fail) {
                return window.HailinHardware._callNative('printerNewLine', options ? [options] : [{}]);
            }
            window.HailinHardware._callNative('printerNewLine', options ? [options] : [{}])
                .then(function(result) { if (success) success(result); })
                .catch(function(error) { if (fail) fail(error); });
        },
        
        printerCut: function(options, success, fail) {
            if (typeof options === 'object' && !success && !fail) {
                return window.HailinHardware._callNative('printerCut', options ? [options] : [{}]);
            }
            window.HailinHardware._callNative('printerCut', options ? [options] : [{}])
                .then(function(result) { if (success) success(result); })
                .catch(function(error) { if (fail) fail(error); });
        },
        
        printerDisconnect: function(success, fail) {
            if (!success && !fail) {
                return window.HailinHardware._callNative('printerDisconnect', [{}]);
            }
            window.HailinHardware._callNative('printerDisconnect', [{}])
                .then(function(result) { if (success) success(result); })
                .catch(function(error) { if (fail) fail(error); });
        },
        
        // 钱箱
        openCashDrawer: function(options, success, fail) {
            if (typeof options === 'object' && !success && !fail) {
                return window.HailinHardware._callNative('openCashDrawer', options ? [options] : [{}]);
            }
            window.HailinHardware._callNative('openCashDrawer', options ? [options] : [{}])
                .then(function(result) { if (success) success(result); })
                .catch(function(error) { if (fail) fail(error); });
        },
        
        // 客显屏
        showOnCustomerDisplay: function(options, success, fail) {
            if (typeof options === 'object' && !success && !fail) {
                return window.HailinHardware._callNative('showOnCustomerDisplay', [options]);
            }
            window.HailinHardware._callNative('showOnCustomerDisplay', [options])
                .then(function(result) { if (success) success(result); })
                .catch(function(error) { if (fail) fail(error); });
        },
        
        dismissCustomerDisplay: function(success, fail) {
            if (!success && !fail) {
                return window.HailinHardware._callNative('dismissCustomerDisplay', [{}]);
            }
            window.HailinHardware._callNative('dismissCustomerDisplay', [{}])
                .then(function(result) { if (success) success(result); })
                .catch(function(error) { if (fail) fail(error); });
        },
        
        // 扫码
        enableBarcodeScanner: function(success, fail) {
            if (!success && !fail) {
                return window.HailinHardware._callNative('enableBarcodeScanner', [{}]);
            }
            window.HailinHardware._callNative('enableBarcodeScanner', [{}])
                .then(function(result) { if (success) success(result); })
                .catch(function(error) { if (fail) fail(error); });
        },
        
        disableBarcodeScanner: function(success, fail) {
            if (!success && !fail) {
                return window.HailinHardware._callNative('disableBarcodeScanner', [{}]);
            }
            window.HailinHardware._callNative('disableBarcodeScanner', [{}])
                .then(function(result) { if (success) success(result); })
                .catch(function(error) { if (fail) fail(error); });
        },
        
        // 事件监听
        addListener: function(eventName, callback) {
            console.log('[HailinHardware] addListener:', eventName);
            if (!HailinHardware._listeners) {
                HailinHardware._listeners = {};
            }
            if (!HailinHardware._listeners[eventName]) {
                HailinHardware._listeners[eventName] = [];
            }
            HailinHardware._listeners[eventName].push(callback);
            
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
        
        // 内部方法：调用原生代码
        _callNative: function(method, args) {
            console.log('[HailinHardware] _callNative:', method, args);
            
            var self = this;
            
            return new Promise(function(resolve, reject) {
                // 查找原生插件的多种方式
                var tryCall = function() {
                    // 方式1: 通过 Capacitor.Plugins (最常用)
                    var capPlugin = (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.HailinHardware);
                    if (capPlugin && typeof capPlugin[method] === 'function') {
                        console.log('[HailinHardware] 使用 Capacitor.Plugins 方式');
                        capPlugin[method].apply(capitorPlugins, args)
                            .then(resolve)
                            .catch(reject);
                        return true;
                    }
                    
                    // 方式2: 通过 Cordova.exec (经典方式)
                    if (window.cordova && window.cordova.exec) {
                        console.log('[HailinHardware] 使用 cordova.exec 方式');
                        window.cordova.exec(
                            function(result) { resolve(result); },
                            function(error) { reject(error); },
                            'HailinHardware',
                            method,
                            args
                        );
                        return true;
                    }
                    
                    // 方式3: 通过 MainActivity 全局方法
                    var mainActivity = (window.MainActivity && window.MainActivity.call);
                    if (mainActivity) {
                        console.log('[HailinHardware] 使用 MainActivity.call 方式');
                        window.MainActivity.call('HailinHardware', method, args)
                            .then(resolve)
                            .catch(reject);
                        return true;
                    }
                    
                    // 方式4: 直接调用 Java 方法 (Android)
                    var androidBridge = (window.android && window.android.bridge);
                    if (androidBridge) {
                        console.log('[HailinHardware] 使用 android.bridge 方式');
                        try {
                            var result = window.android.bridge.call(method, JSON.stringify(args));
                            if (result) {
                                resolve(JSON.parse(result));
                            } else {
                                resolve({ success: true });
                            }
                        } catch (e) {
                            reject(e);
                        }
                        return true;
                    }
                    
                    return false;
                };
                
                // 尝试立即调用
                if (tryCall()) return;
                
                // 如果立即调用失败，等待Capacitor初始化后重试
                console.log('[HailinHardware] 等待Capacitor初始化...');
                var retryCount = 0;
                var maxRetries = 20; // 增加重试次数，最多10秒
                var retryDelay = 500;
                
                var retryInterval = setInterval(function() {
                    retryCount++;
                    console.log('[HailinHardware] 重试 #' + retryCount);
                    
                    if (tryCall()) {
                        clearInterval(retryInterval);
                        return;
                    }
                    
                    if (retryCount >= maxRetries) {
                        clearInterval(retryInterval);
                        console.error('[HailinHardware] ❌ 无法找到原生插件 (已重试' + maxRetries + '次)');
                        reject(new Error('Plugin not available after ' + maxRetries + ' retries'));
                    }
                }, retryDelay);
            });
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
    
    // 挂载到 Capacitor.Plugins
    if (window.Capacitor) {
        if (!window.Capacitor.Plugins) {
            window.Capacitor.Plugins = {};
        }
        window.Capacitor.Plugins.HailinHardware = HailinHardware;
        console.log('[Cordova] HailinHardware 已注册到 Capacitor.Plugins');
    }
    
    console.log('[Cordova] HailinHardware 插件桥接初始化完成');
    console.log('[Cordova] 可用的调用方式:');
    console.log('[Cordova] 1. Capacitor.Plugins.HailinHardware.scaleConnect()');
    console.log('[Cordova] 2. window.HailinHardware.scaleConnect()');
    console.log('[Cordova] 3. window.MainActivity.call("HailinHardware", method, args)');
    
})();
