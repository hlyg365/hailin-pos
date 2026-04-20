# 海邻到家收银APP - 实测问题追踪

## 测试设备
- **收银机**: 京东收银机（Android系统）
- **电子秤**: 顶尖OS2X-15（串口/RS232）

---

## 问题记录与解决方案

### 1. 蓝屏问题
**现象**: APP打开后蓝屏，无法加载任何内容

**原因**: App.tsx中使用AuthGuard但未定义

**解决方案**: 重写完整的App.tsx，包含AuthGuard和CashierAuthGuard定义

**状态**: ✅ 已解决

---

### 2. 称重数据异常
**现象**: 
- 没有放商品也显示重量数据（0.455kg不稳定）
- 商品取下后数据不归零

**原因**: 
- 模拟模式初始重量设为0.5
- 波特率9600与顶尖OS2默认2400不匹配
- 协议设置为general而非soki

**解决方案**:
- 模拟模式初始重量改为0
- 波特率默认2400
- 协议默认soki（顶尖OS2专用协议）
- Android端修改默认波特率9600→2400

**状态**: ✅ 已解决

---

### 3. 配置保存丢失
**现象**: 设置后退出再进入，配置丢失

**原因**: Capacitor APP中localStorage不可靠

**解决方案**: 
- 添加@capacitor/preferences插件
- 使用Zustand + Capacitor Preferences存储适配器
- 配置存储key: `hailin-device-config`

**状态**: ✅ 已解决

---

### 4. 设备与设置入口重复
**现象**: 收银台顶部有"设备"和"设置"两个按钮，功能重复

**原因**: 早期设计不合理

**解决方案**: 
- 合并为单一"设置"入口
- 跳转到独立设置页面 `/settings`
- 设备面板改为常用设置开关+设备管理

**状态**: ✅ 已解决

---

### 5. 电子秤串口连接失败
**现象**: 设置页面日志显示"串口秤连接失败"

**原因**: 
- Web Serial API在京东收银机浏览器/Android WebView中不支持
- 需要使用Android原生USB Serial插件

**解决方案**:
- 前端检测Android原生环境
- 优先使用Android原生 `HailinHardware.scaleConnect()` 
- 回退到Web Serial API（仅浏览器支持）
- 设置页面添加串口设备选择（ttyS0/ttyUSB0/ttyACM0）
- 添加"检测"按钮调用Android插件

**关键参数**:
| 参数 | 值 |
|------|-----|
| 串口 | /dev/ttyS0 (主板串口) 或 /dev/ttyUSB0 (USB转串口) |
| 波特率 | 2400 bps |
| 数据位 | 8 |
| 停止位 | 1 |
| 校验 | 无 |
| 协议 | soki (顶尖OS2专用) |

**状态**: 🔄 待实测验证

---

### 6. APK大小异常
**现象**: APK大小10-16MB而非正常的4.3MB

**原因**: android/app/src/main/assets/public/ 目录残留多个APK文件

**解决方案**: 每次构建前执行清理
```bash
rm -f public/*.apk
rm -f android/app/src/main/assets/public/*.apk
npx cap sync android
```

**状态**: ✅ 已解决

---

## 电子秤配置要点（实测经验）

### 顶尖OS2X-15 电子秤

**通讯参数**:
- 波特率: **2400** (默认，需与秤本机一致)
- 数据位: 8
- 停止位: 1
- 校验: 无

**常见问题排查**:
1. 按【置零】后秤屏幕归零但APP不动 → 波特率不匹配或串口线问题
2. 数据乱跳 → 波特率不匹配或线缆质量问题
3. 拿掉商品不归零 → 可能是秤的零点跟踪功能，需按置零键

**Android串口设备识别**:
- `/dev/ttyS0` - 主板串口0
- `/dev/ttyS1` - 主板串口1
- `/dev/ttyUSB0` - USB转串口(CH340/PL2303)
- `/dev/ttyUSB1` - USB转串口1
- `/dev/ttyACM0` - USB Modem/CDC设备

---

## APK构建规范

### 必须执行流程
```bash
# 1. 清理旧APK
rm -f public/*.apk
rm -f android/app/src/main/assets/public/*.apk

# 2. 构建前端
pnpm build

# 3. 同步到Android
npx cap sync android

# 4. 修复Java版本
find android -name "*.gradle" -exec sed -i 's/VERSION_21/VERSION_17/g' {} \;

# 5. 构建APK
cd android && ./gradlew assembleDebug

# 6. 复制到public
cp android/app/build/outputs/apk/debug/app-debug.apk public/hailin-pos-vX.X.XXX.apk

# 7. 上传到对象存储
node scripts/upload-apk.mjs
```

### 正常APK大小
- **4.3MB** - 正常
- **8-16MB** - 异常，assets里有残留APK

---

## 待解决/待验证

1. **电子秤串口连接** - 需在京东收银机上实测验证
2. **网口连接** - 如果串口不行可尝试网口TCP连接
3. **自动重连** - 设备断开后自动重连机制
4. **多设备同时连接** - 扫码枪+打印机+电子秤同时工作

---

*最后更新: 2024年*
