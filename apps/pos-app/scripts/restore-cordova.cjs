/**
 * 恢复 Cordova 插件文件
 * Capacitor sync 会将 cordova.js 覆盖为空文件，此脚本用于恢复
 */

const fs = require('fs');
const path = require('path');

const androidAssets = 'android/app/src/main/assets/public';

// 恢复 cordova.js
const srcCordova = 'public/cordova.js';
const destCordova = path.join(androidAssets, 'cordova.js');

// 恢复 cordova_plugins.js
const srcPlugins = 'public/cordova_plugins.js';
const destPlugins = path.join(androidAssets, 'cordova_plugins.js');

function restoreFile(src, dest) {
  if (fs.existsSync(src)) {
    const srcSize = fs.statSync(src).size;
    fs.copyFileSync(src, dest);
    const destSize = fs.statSync(dest).size;
    console.log(`✅ 已恢复: ${dest}`);
    console.log(`   大小: ${srcSize} bytes`);
    if (destSize !== srcSize) {
      console.warn(`⚠️ 警告: 目标文件大小不一致!`);
    }
  } else {
    console.error(`❌ 源文件不存在: ${src}`);
  }
}

console.log('🔧 恢复 Cordova 插件文件...\n');
restoreFile(srcCordova, destCordova);
restoreFile(srcPlugins, destPlugins);
console.log('\n✨ 完成！');
