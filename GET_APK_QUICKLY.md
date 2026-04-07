# 🚀 获取APK的最快方式

## 📋 方案对比

| 方案 | 难度 | 时间 | 需要的准备 |
|------|------|------|-----------|
| **GitHub Actions** | ⭐ | 10-15分钟 | GitHub账号 |
| **本地构建** | ⭐⭐⭐ | 30-60分钟 | 电脑+耐心 |
| **VoltBuilder** | ⭐⭐ | 15-20分钟 | 注册账号 |

---

## 🎯 推荐：GitHub Actions 自动构建

### 只需3步！

#### 第一步：创建GitHub仓库

1. 访问 **https://github.com** 并登录
2. 点击右上角 **"+"** → **"New repository"**
3. 填写：
   - Repository name: `hailin-pos`
   - 选择 **Private** 或 **Public**（公开仓库免费）
   - ✅ 不勾选 "Initialize this repository with a README"
4. 点击 **"Create repository"**

#### 第二步：上传代码

在项目目录执行：

```bash
# 初始化 git（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit - 海邻到家店长助手 v1.0"

# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/hailin-pos.git

# 推送
git branch -M main
git push -u origin main
```

#### 第三步：等待构建完成

1. 访问你的 GitHub 仓库
2. 点击顶部 **"Actions"** 标签
3. 看到构建任务正在运行（黄色圆圈）
4. 等待 5-10 分钟
5. 绿色勾选表示构建成功 ✅

#### 下载APK

1. 点击构建任务
2. 点击 **"build-apk"** 任务
3. 在底部找到 **"APK"** 部分
4. 点击 **"hailin-assistant-apk"** 下载

---

## 🔧 或者：发布正式版本

### 创建 Release

```bash
# 在本地执行
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions 会自动：
1. 构建 APK
2. 创建 Release
3. 上传 APK

### 下载 Release 版本

1. 访问 GitHub 仓库主页
2. 点击右侧 **"Release"** 或 **"Releases"**
3. 点击 **"v1.0.0"**
4. 下载 **app-debug.apk**

---

## 📱 安装 APK

1. 将 APK 文件传到手机
2. 打开手机设置 → 安全 → 允许未知来源
3. 点击 APK 文件安装

---

## 🔄 后续更新

以后更新APP只需：

```bash
# 修改代码后
git add .
git commit -m "更新说明"
git push

# 自动构建，新APK在 GitHub Actions 下载
```

---

## ❓ 常见问题

### Q: GitHub 需要付费吗？

**A**: 
- **公开仓库**：免费
- **私有仓库**：免费（有限额）
- GitHub Actions：公开仓库每月2000分钟免费

### Q: 构建失败怎么办？

**A**: 
1. 点击失败的构建任务
2. 查看错误日志
3. 常见问题：
   - 代码错误 → 检查错误信息并修复
   - 超时 → 重试
   - 内存不足 → 联系我们

### Q: APK 安全吗？

**A**: 
- ✅ GitHub Actions 在官方服务器构建
- ✅ 代码来自你自己的仓库
- ⚠️ 建议首次安装时检查应用权限

---

## 📞 需要帮助？

如果你在操作过程中遇到问题，请告诉我：
1. 在哪一步遇到问题？
2. 看到了什么错误信息？

我会帮你解决！

---

**文档版本**: v1.0
**更新时间**: 2024-04-07
