#!/usr/bin/env node
/**
 * HailinHardware插件自动注册脚本
 * 
 * 在cap sync之后运行，自动将HailinHardware插件添加到capacitor.plugins.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ANDROID_ASSETS_DIR = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets');
const CAPACITOR_PLUGINS_FILE = path.join(ANDROID_ASSETS_DIR, 'capacitor.plugins.json');

// HailinHardware插件配置
const HAILIN_HARDWARE_PLUGIN = {
    pkg: 'hailin-hardware',
    classpath: 'com.hailin.pos.HailinHardwarePlugin'
};

const HAILIN_TTS_PLUGIN = {
    pkg: 'hailin-tts', 
    classpath: 'com.hailin.pos.TTSPlugin'
};

function addHailinPlugins() {
    console.log('[HailinPlugin] 检查插件注册状态...');
    
    // 检查文件是否存在
    if (!fs.existsSync(CAPACITOR_PLUGINS_FILE)) {
        console.error('[HailinPlugin] capacitor.plugins.json 不存在!');
        return false;
    }
    
    // 读取现有插件列表
    let plugins = [];
    try {
        const content = fs.readFileSync(CAPACITOR_PLUGINS_FILE, 'utf8');
        plugins = JSON.parse(content);
    } catch (e) {
        console.error('[HailinPlugin] 读取插件配置失败:', e.message);
        return false;
    }
    
    // 检查是否已存在
    const hasHailinHardware = plugins.some(p => 
        p.classpath && p.classpath.includes('HailinHardwarePlugin')
    );
    
    if (hasHailinHardware) {
        console.log('[HailinPlugin] HailinHardware插件已存在');
        return true;
    }
    
    // 添加HailinHardware插件
    plugins.push(HAILIN_HARDWARE_PLUGIN);
    plugins.push(HAILIN_TTS_PLUGIN);
    
    // 写入文件
    try {
        fs.writeFileSync(CAPACITOR_PLUGINS_FILE, JSON.stringify(plugins, null, 2));
        console.log('[HailinPlugin] ✓ HailinHardware插件注册成功');
        console.log('[HailinPlugin]   - HailinHardwarePlugin: ' + HAILIN_HARDWARE_PLUGIN.classpath);
        console.log('[HailinPlugin]   - TTSPlugin: ' + HAILIN_TTS_PLUGIN.classpath);
        return true;
    } catch (e) {
        console.error('[HailinPlugin] 写入插件配置失败:', e.message);
        return false;
    }
}

// 运行脚本
const isMainModule = process.argv[1] === import.meta.url.slice(7);
if (isMainModule) {
    addHailinPlugins();
}

export { addHailinPlugins };
