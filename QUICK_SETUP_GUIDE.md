# 快速配置向导

按照此向导，快速完成所有配置！

---

## 📋 配置前准备

在开始之前，请确保你已经：
- [ ] 完成了微信小程序注册
- [ ] 完成了微信支付开通
- [ ] 购买了域名和服务器
- [ ] 配置了HTTPS证书

---

## 🔧 第1步：配置环境变量

### 1.1 创建 .env 文件

```bash
# 复制模板文件
cp .env.example .env

# 编辑配置文件
nano .env
```

### 1.2 填写配置信息

#### 必须配置（P0）

**小程序配置**：
```env
WECHAT_APP_ID=wx1234567890abcdef
WECHAT_APP_SECRET=your_app_secret_here
```

**微信支付配置**：
```env
WECHAT_MCH_ID=1234567890
WECHAT_MCH_KEY=your_32_char_key_here
WECHAT_MCH_CERT_PATH=/home/hailin/cert.p12
WECHAT_MCH_CERT_PASSWORD=1234567890
```

**数据库配置**：
```env
DATABASE_URL=postgresql://hailin_user:password@localhost:5432/hailin
DB_USER=hailin_user
DB_PASSWORD=your_password
```

**服务器配置**：
```env
BASE_URL=https://api.hailin.com
PORT=5000
```

**JWT配置**：
```env
JWT_SECRET=your_random_jwt_secret_key_here_min_32_characters
```

#### 可选配置（P1-P2）

**对象存储配置**：
```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=cn-hangzhou
AWS_BUCKET=hailin-images
```

**短信服务配置**：
```env
SMS_ACCESS_KEY_ID=your_sms_key
SMS_ACCESS_KEY_SECRET=your_sms_secret
SMS_SIGN_NAME=海邻到家
```

---

## 🚀 第2步：部署后端服务

### 2.1 上传代码到服务器

```bash
# 在本地打包代码
pnpm build

# 上传到服务器
scp -r . user@your-server:/home/hailin/
```

### 2.2 安装依赖

```bash
# 登录服务器
ssh user@your-server

# 进入项目目录
cd /home/hailin

# 安装依赖
pnpm install
```

### 2.3 创建数据库

```bash
# 连接到PostgreSQL
sudo -u postgres psql

# 执行SQL命令
CREATE DATABASE hailin;
CREATE USER hailin_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE hailin TO hailin_user;
\q
```

### 2.4 初始化数据库

```bash
# 运行数据库迁移
pnpm prisma migrate deploy

# 或使用SQL脚本
psql -U hailin_user -d hailin -f schema.sql
```

### 2.5 启动服务

```bash
# 使用PM2启动
pm2 start npm --name "hailin-api" -- start

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup
```

### 2.6 验证服务

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs hailin-api

# 测试API
curl https://api.hailin.com/api/health
```

---

## 📱 第3步：配置小程序

### 3.1 配置服务器域名

1. 登录微信公众平台
2. 进入"开发" > "开发管理" > "开发设置"
3. 配置服务器域名：
   - request合法域名：`https://api.hailin.com`
   - uploadFile合法域名：`https://api.hailin.com`
   - downloadFile合法域名：`https://api.hailin.com`
   - socket合法域名：`wss://api.hailin.com`

### 3.2 配置小程序信息

1. 设置小程序名称、头像
2. 配置服务类目
3. 填写隐私协议
4. 填写用户协议

### 3.3 测试小程序

```bash
# 在HBuilderX中
1. 打开 hailin-ministore 项目
2. 配置AppID
3. 运行到微信开发者工具
4. 测试所有功能
```

---

## 📦 第4步：构建收银台APK

### 4.1 准备环境

```bash
# 安装Java JDK 11+
sudo apt install openjdk-11-jdk

# 安装Android SDK
# 下载并解压Android SDK
# 配置环境变量

export ANDROID_HOME=/opt/android-sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### 4.2 构建APK

```bash
# 进入项目目录
cd /home/hailin

# 构建Next.js
pnpm build

# 同步到Capacitor
npx cap sync android

# 构建APK
cd android
./gradlew assembleDebug

# APK文件位置
# android/app/build/outputs/apk/debug/app-debug.apk
```

### 4.3 测试APK

```bash
# 连接设备
adb devices

# 安装APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# 启动应用
adb shell am start -n com.hailin.pos.cashier/.MainActivity
```

---

## ✅ 第5步：验证所有功能

### 5.1 后端服务验证

```bash
# 健康检查
curl https://api.hailin.com/api/health

# 商品API测试
curl https://api.hailin.com/api/products

# 用户API测试
curl -X POST https://api.hailin.com/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","code":"123456"}'
```

### 5.2 小程序验证

在微信开发者工具中测试：
- [ ] 首页加载正常
- [ ] 商品列表正常
- [ ] 购物车功能正常
- [ ] 订单功能正常
- [ ] 支付功能正常

### 5.3 收银台APK验证

在Android设备中测试：
- [ ] 应用启动正常
- [ ] 扫码功能正常
- [ ] 购物车功能正常
- [ ] 支付功能正常
- [ ] 打印功能正常

---

## 🚨 常见问题

### Q1: 后端服务启动失败

**A**: 检查以下内容：
1. 端口是否被占用：`lsof -i :5000`
2. 数据库连接是否正常
3. 环境变量是否正确配置

### Q2: 小程序无法连接服务器

**A**: 检查以下内容：
1. 服务器域名是否正确配置
2. HTTPS证书是否有效
3. 服务器防火墙是否开放端口

### Q3: 支付功能不工作

**A**: 检查以下内容：
1. 微信支付配置是否正确
2. 回调地址是否正确
3. 证书文件是否正确

### Q4: APK构建失败

**A**: 检查以下内容：
1. Java JDK是否正确安装
2. Android SDK是否正确配置
3. 环境变量是否正确设置

---

## 📞 需要帮助？

### 技术文档
- [后端API文档](./API_DOCS.md)
- [小程序开发文档](./hailin-ministore/README.md)
- [APK构建指南](./POS_APK_BUILD_GUIDE.md)

### 联系方式
- 技术支持：support@hailin.com
- 紧急电话：400-xxx-xxxx

---

## 🎉 配置完成

恭喜！你已经完成了所有配置，现在可以：

1. ✅ 提交小程序审核
2. ✅ 分发收银台APK
3. ✅ 开始使用系统

---

## 📋 后续维护

### 日常维护
- 定期备份数据库
- 监控服务器状态
- 查看错误日志
- 更新系统补丁

### 安全维护
- 定期更换密钥
- 更新SSL证书
- 检查安全漏洞
- 审计访问日志

---

**文档版本：v1.0**
**创建时间：2024-04-07**
**维护者：海邻到家技术团队**
