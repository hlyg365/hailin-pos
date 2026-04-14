const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const androidDir = path.join(projectRoot, 'android/app/src/main/res');
const sourceLogo = path.join(projectRoot, 'public/logo.png');

// Android 图标尺寸配置
const sizes = [
  // mipmap 目录
  { name: 'mipmap-mdpi/ic_launcher.png', size: 48 },
  { name: 'mipmap-hdpi/ic_launcher.png', size: 72 },
  { name: 'mipmap-xhdpi/ic_launcher.png', size: 96 },
  { name: 'mipmap-xxhdpi/ic_launcher.png', size: 144 },
  { name: 'mipmap-xxxhdpi/ic_launcher.png', size: 192 },
  // adaptive icon 背景和前景
  { name: 'mipmap-anydpi-v26/ic_launcher.xml', size: null, isXml: true },
  { name: 'mipmap-anydpi-v26/ic_launcher_round.xml', size: null, isXml: true },
  // drawable 目录
  { name: 'drawable/ic_launcher_foreground.png', size: 108 },
  { name: 'drawable/ic_launcher_background.png', size: 108, isBackground: true },
];

// 自适应图标 XML 模板
const adaptiveIconXml = (isRound = false) => `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>`;

async function generateIcons() {
  console.log('开始生成 Android 图标...');
  
  // 确保目录存在
  ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi', 
   'mipmap-anydpi-v26', 'drawable'].forEach(dir => {
    const fullPath = path.join(androidDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });

  // 读取源图片
  const source = await sharp(sourceLogo)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();

  // 生成普通图标
  for (const config of sizes) {
    if (config.isXml) {
      // 写入 XML 文件
      const xmlPath = path.join(androidDir, config.name);
      fs.writeFileSync(xmlPath, adaptiveIconXml(config.name.includes('round')));
      console.log(`生成: ${config.name}`);
    } else {
      // 生成 PNG 图标
      const targetPath = path.join(androidDir, config.name);
      const image = await sharp(source)
        .resize(config.size, config.size, { fit: 'contain' })
        .png()
        .toFile(targetPath);
      console.log(`生成: ${config.name} (${config.size}x${config.size})`);
    }
  }

  // 生成 splash 图标（用于启动画面）
  const splashSizes = [200, 300, 400, 600, 800, 1000];
  for (const size of splashSizes) {
    const splashPath = path.join(androidDir, `drawable/splash_${size}.png`);
    await sharp(source)
      .resize(size, size, { fit: 'contain' })
      .png()
      .toFile(splashPath);
  }
  console.log('生成 splash 图标完成');

  console.log('所有图标生成完成!');
}

generateIcons().catch(console.error);
