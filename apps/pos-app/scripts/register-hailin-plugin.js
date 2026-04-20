#!/bin/bash
# 自动注册HailinHardware插件到Capacitor

ANDROID_DIR="android/app/src/main/assets"

# 添加HailinHardware插件到capacitor.plugins.json
if [ -f "$ANDROID_DIR/capacitor.plugins.json" ]; then
    # 检查是否已包含HailinHardware
    if ! grep -q "HailinHardware" "$ANDROID_DIR/capacitor.plugins.json"; then
        echo "添加HailinHardware插件到capacitor.plugins.json..."
        
        # 使用Node.js来修改JSON
        node -e "
        const fs = require('fs');
        const path = '$ANDROID_DIR/capacitor.plugins.json';
        let plugins = JSON.parse(fs.readFileSync(path, 'utf8'));
        
        // 检查是否已存在
        const exists = plugins.some(p => p.classpath && p.classpath.includes('HailinHardware'));
        if (!exists) {
            plugins.push({
                'pkg': 'hailin-hardware',
                'classpath': 'com.hailin.pos.HailinHardwarePlugin'
            });
            fs.writeFileSync(path, JSON.stringify(plugins, null, 2));
            console.log('HailinHardware插件已添加');
        } else {
            console.log('HailinHardware插件已存在');
        }
        "
    else
        echo "HailinHardware插件已存在"
    fi
fi

echo "完成"
