# Windows 电脑打包 APK 完整教程

## 第一部分：准备工作

### 1.1 需要安装的软件

| 软件 | 版本 | 大小 | 下载地址 |
|------|------|------|----------|
| Node.js | 18.x LTS | 20MB | https://nodejs.org/ |
| JDK | 11 或 17 | 150MB | https://adoptium.net/ |
| Android Studio | 2023.x | 1GB | https://developer.android.com/studio |

---

## 第二部分：安装步骤

### 2.1 安装 Node.js

1. 访问 https://nodejs.org/
2. 下载 **LTS 版本**（左侧绿色按钮）
3. 运行安装程序
4. **全部选择默认选项**，一路点"下一步"
5. 安装完成后，按 `Win + R`，输入 `cmd`，回车
6. 输入以下命令验证：

```bash
node -v
# 应该显示 v18.x.x

npm -v
# 应该显示 9.x.x
```

### 2.2 安装 JDK

1. 访问 https://adoptium.net/temurin/releases/
2. 选择：
   - **Operating System**: Windows
   - **Architecture**: x64
   - **Package Type**: JDK
   - **Version**: 17 (或 11)
3. 点击 `.msi` 下载
4. 运行安装程序，**选择默认路径**
5. 验证安装：打开 cmd，输入

```bash
java -version
# 应该显示 openjdk version "17.x.x"
```

### 2.3 安装 Android Studio

#### 步骤1：下载

访问 https://developer.android.com/studio
点击 "Download Android Studio Hedgehog" 或 "Download"

#### 步骤2：安装

1. 运行下载的 `.exe` 文件
2. 选择安装路径（建议放在 D 盘）：
   ```
   D:\AndroidStudio
   ```
3. 组件选择（全部勾选）：
   - ☑ Android Studio
   - ☑ Android SDK
   - ☑ Android SDK Platform-tools
   - ☑ Android SDK Build-Tools
   - ☑ Android SDK Command-line Tools

4. 点击 "Install" 等待安装完成（约10分钟）

#### 步骤3：首次启动配置

1. 运行 Android Studio
2. 选择 "Do not import settings"
3. 点击 "OK"
4. 等待 "Downloading Components" 完成
5. 安装向导完成

#### 步骤4：配置环境变量

1. 按 `Win + R`，输入 `sysdm.cpl`，回车
2. 点击 "高级" → "环境变量"
3. 在 "系统变量" 中新建：

```
变量名: JAVA_HOME
变量值: C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot
```
（路径根据实际安装位置修改）

```
变量名: ANDROID_HOME
变量值: C:\Users\你的用户名\AppData\Local\Android\Sdk
```

4. 编辑 "系统变量" 中的 `Path`，添加：
   ```
   %JAVA_HOME%\bin
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\tools
   %ANDROID_HOME%\tools\bin
   ```

5. 点击确定保存

#### 步骤5：验证配置

打开新的 cmd 窗口，输入：

```bash
echo %JAVA_HOME%
echo %ANDROID_HOME%
adb version
```

---

## 第三部分：项目配置

### 3.1 下载项目代码

如果您还没有项目代码：

```bash
# 进入要存放项目的目录
cd D:\Projects

# 克隆项目（如果有Git仓库）
git clone <项目地址>

# 或者解压我提供的源码包到 D:\Projects\hailin-pos
```

### 3.2 安装项目依赖

1. 打开 cmd，进入项目目录：
```bash
cd D:\Projects\hailin-pos\apps\pos-app

# 安装前端依赖
npm install
```

### 3.3 构建前端

```bash
# 构建 Web 应用
npm run build
```

等待完成后，会在 `apps/pos-app/` 下生成 `dist` 文件夹。

---

## 第四部分：打包 APK

### 方式一：Android Studio（推荐新手）

#### 步骤1：打开项目

1. 打开 Android Studio
2. 点击 "Open"
3. 选择项目目录：
   ```
   D:\Projects\hailin-pos\apps\pos-android\android
   ```
4. 等待 Gradle 同步完成（约5分钟）

#### 步骤2：首次同步

如果提示 "Gradle Sync"，点击 "OK"

如果同步失败，尝试：
1. 点击 "File" → "Invalidate Caches" → "Invalidate and Restart"
2. 重新打开项目

#### 步骤3：同步 Capacitor

打开一个新的 cmd 窗口：

```bash
cd D:\Projects\hailin-pos\apps\pos-android

# 同步 Web 资源到 Android 项目
npx cap sync android
```

#### 步骤4：构建 APK

回到 Android Studio：

1. 点击右侧 "Gradle" 面板
2. 展开 "app" → "Tasks" → "build"
3. 双击 "assembleDebug"

或者使用菜单：
- 点击 "Build" → "Build Bundle(s) / APK(s)" → "Build APK(s)"

#### 步骤5：等待构建

右下角会显示进度条，等待完成后显示：
```
Build completed successfully
```

#### 步骤6：找到 APK 文件

```
D:\Projects\hailin-pos\apps\pos-android\android\app\build\outputs\apk\debug\app-debug.apk
```

---

### 方式二：命令行打包

#### 步骤1：打开命令行

按 `Win + X`，选择 "终端" 或 "命令提示符"

#### 步骤2：进入项目目录

```bash
cd D:\Projects\hailin-pos\apps\pos-android\android
```

#### 步骤3：设置权限

```bash
# 给 Gradle 执行权限
gradlew.bat
```

#### 步骤4：清理并构建

```bash
# 清理旧构建
.\gradlew.bat clean

# 构建 Debug APK
.\gradlew.bat assembleDebug
```

#### 步骤5：等待构建完成

约5-10分钟，视电脑配置而定。

---

## 第五部分：安装到一体机

### 5.1 复制到U盘

1. 将 APK 文件复制到 U盘
2. U盘插入一体机
3. 在一体机上打开"文件管理"或"我的文件"
4. 找到 APK 文件，点击安装
5. 如果提示"禁止安装未知来源应用"：
   - 进入"设置" → "安全"
   - 开启"未知来源"
   - 或找到"安装未知应用"选项

### 5.2 网络安装（推荐批量部署）

#### 在一体机上开启 ADB

1. 进入一体机"设置"
2. 找到"关于平板电脑"
3. 连续点击"版本号"7次，开启开发者模式
4. 返回"设置"主菜单
5. 进入"开发者选项"
6. 开启"USB调试"
7. 开启"网络ADB"或"无线调试"

#### 在电脑上连接

```bash
# 查看一体机IP（在一体机设置中查看）
# 假设一体机IP是 192.168.1.100

# 连接一体机
adb connect 192.168.1.100:5555

# 如果连接成功，显示：
# connected to 192.168.1.100:5555

# 安装 APK
adb install -r D:\Projects\hailin-pos\apps\pos-android\android\app\build\outputs\apk\debug\app-debug.apk
```

#### 常用 ADB 命令

```bash
# 查看已连接设备
adb devices

# 断开连接
adb disconnect 192.168.1.100:5555

# 查看日志
adb logcat | findstr hailin

# 卸载应用
adb uninstall com.hailin.pos

# 强制停止应用
adb shell am force-stop com.hailin.pos
```

---

## 第六部分：硬件连接测试

### 6.1 电子秤

一体机通常使用 USB 转串口连接电子秤：

1. 将 USB 转串口线插入一体机 USB 口
2. 另一端连接电子秤串口
3. 运行收银APP
4. 在设置中：
   - 选择正确的串口（通常自动检测）
   - 波特率设为 9600

### 6.2 打印机

小票打印机通常即插即用：

1. 连接 USB 线
2. 打印机自动安装驱动
3. 测试打印

---

## 第七部分：常见问题

### Q1: Gradle 同步失败

**错误信息**: `Gradle sync failed: Connection refused`

**解决方法**:
1. 确保网络畅通
2. 点击 "File" → "Settings" → "Gradle"
3. 关闭 "Offline mode"
4. 重新同步

### Q2: Java 版本不对

**错误信息**: `compileSdkVersion XX requires JDK 11 or later`

**解决方法**:
1. 确认 JAVA_HOME 指向 JDK 11+
2. Android Studio: File → Project Structure → SDK Location
3. 确保 JDK location 正确

### Q3: 找不到 Android SDK

**错误信息**: `ANDROID_HOME is not set`

**解决方法**:
1. 打开 Android Studio
2. 点击 "File" → "Settings" → "Appearance & Behavior" → "System Settings" → "Android SDK"
3. 复制 SDK 路径
4. 设置环境变量 ANDROID_HOME

### Q4: USB 设备无法识别

**解决方法**:
1. 检查 USB 线是否正常
2. 尝试其他 USB 口
3. 确认一体机 USB 驱动已安装
4. 在开发者选项中开启"USB调试"

### Q5: 构建太慢

**优化方法**:
1. 增加 Gradle 内存：
   
   在 `gradle.properties` 中添加：
   ```properties
   org.gradle.jvmargs=-Xmx4096m -XX:+HeapDumpOnOutOfMemoryError
   org.gradle.parallel=true
   org.gradle.daemon=true
   ```

2. 使用 SSD 硬盘

3. 首次构建后，后续构建会更快

---

## 联系方式

如有问题，请联系海邻到家技术支持。
