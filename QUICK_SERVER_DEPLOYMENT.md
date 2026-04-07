# 服务器部署快速指南

## 🚀 快速开始

### 当前状态
- ✅ 扣子平台运行中
- ✅ 公众号、小程序、域名已有
- 🎯 目标：部署到独立服务器

---

## 📋 部署方案选择

### 推荐：渐进式迁移

```
当前 → 短期 → 长期
扣子 → 扣子+独立DB → 完全独立服务器
```

### 方案对比

| 方案 | 成本 | 复杂度 | 适用场景 |
|------|------|--------|----------|
| 继续用扣子 | 低 | 简单 | 快速验证 |
| 混合部署 | 中 | 中等 | 长期运营 |
| 完全迁移 | 高 | 复杂 | 企业级 |

**推荐：混合部署（推荐）**

---

## 🔧 最小服务器配置

### 推荐配置
- **CPU**: 2核
- **内存**: 4GB
- **硬盘**: 80GB SSD
- **带宽**: 5Mbps
- **系统**: Ubuntu 22.04

### 费用
- **阿里云/腾讯云**: 约100-200元/月
- **包含**: ECS + 域名解析 + SSL证书

---

## 📝 快速部署步骤

### 第1步：购买服务器

1. 访问阿里云或腾讯云
2. 选择"轻量应用服务器"或"ECS"
3. 配置：
   - 地域：选择离用户最近的
   - 系统：Ubuntu 22.04 LTS
   - 规格：2核4G
   - 带宽：5Mbps
   - 硬盘：80GB SSD
4. 设置root密码
5. 购买

**预计时间**: 10分钟

---

### 第2步：安装软件

连接到服务器：

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装Nginx
sudo apt install -y nginx

# 安装PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 安装PM2
sudo npm install -g pm2

# 验证安装
node -v  # v18.x.x
npm -v   # 9.x.x
nginx -v
psql --version
pm2 --version
```

**预计时间**: 10分钟

---

### 第3步：配置数据库

```bash
# 切换到postgres用户
sudo -u postgres psql

# 在psql命令行中执行：
CREATE DATABASE hailin;
CREATE USER hailin_user WITH PASSWORD '你的强密码';
GRANT ALL PRIVILEGES ON DATABASE hailin TO hailin_user;
\q

# 配置远程连接（可选）
sudo nano /etc/postgresql/14/main/pg_hba.conf
# 添加：host all all 0.0.0.0/0 md5

sudo nano /etc/postgresql/14/main/postgresql.conf
# 修改：listen_addresses = '*'

sudo systemctl restart postgresql
```

**预计时间**: 5分钟

---

### 第4步：配置Nginx

```bash
# 申请SSL证书（使用Let's Encrypt）
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.你的域名.com

# 或手动配置（已有证书）
sudo nano /etc/nginx/sites-available/api.hailin.com

# 写入配置：
upstream hailin_backend {
    server 127.0.0.1:5000;
    keepalive 64;
}

server {
    listen 80;
    server_name api.你的域名.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.你的域名.com;

    ssl_certificate /etc/letsencrypt/live/api.你的域名.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.你的域名.com/privkey.pem;

    client_max_body_size 10M;

    location / {
        proxy_pass http://hailin_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/api.hailin.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**预计时间**: 10分钟

---

### 第5步：部署代码

```bash
# 创建目录
sudo mkdir -p /var/www/hailin
sudo chown -R $USER:$USER /var/www/hailin

# 上传代码（本地执行）
# scp -r ./hailin-code user@服务器IP:/var/www/hailin/

# 或使用Git
cd /var/www/hailin
git clone https://your-repo.git .

# 安装依赖
cd /var/www/hailin
pnpm install

# 创建环境变量
cp .env.example .env
nano .env  # 填写实际配置

# 构建
pnpm build

# 创建PM2配置
nano ecosystem.config.js
```

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'hailin-api',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 5000',
    cwd: '/var/www/hailin',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/pm2/hailin-error.log',
    out_file: '/var/log/pm2/hailin-out.log',
    autorestart: true,
    watch: false
  }]
};
```

```bash
# 启动服务
mkdir -p /var/log/pm2
pm2 start ecosystem.config.js

# 保存配置
pm2 save

# 设置开机自启
pm2 startup
```

**预计时间**: 20分钟

---

### 第6步：配置小程序

1. 登录微信公众平台
2. 进入"开发" > "开发管理" > "开发设置"
3. 配置服务器域名：
   - request合法域名：`https://api.你的域名.com`
   - uploadFile合法域名：`https://api.你的域名.com`
   - downloadFile合法域名：`https://api.你的域名.com`
4. 保存

**预计时间**: 5分钟

---

### 第7步：测试

```bash
# 测试API
curl https://api.你的域名.com/api/health

# 测试页面
curl https://api.你的域名.com

# 查看PM2状态
pm2 status

# 查看日志
pm2 logs hailin-api --lines 50
```

**预计时间**: 5分钟

---

## 📊 总时间

| 步骤 | 时间 |
|------|------|
| 购买服务器 | 10分钟 |
| 安装软件 | 10分钟 |
| 配置数据库 | 5分钟 |
| 配置Nginx | 10分钟 |
| 部署代码 | 20分钟 |
| 配置小程序 | 5分钟 |
| 测试 | 5分钟 |
| **总计** | **约1小时** |

---

## 💰 成本

| 项目 | 月费用 | 年费用 |
|------|--------|--------|
| 服务器 | 100-200元 | 1200-2400元 |
| 域名 | 5-20元 | 60-240元 |
| **合计** | **约200元** | **约2500元** |

---

## 🔒 安全配置

### 防火墙

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### 备份脚本

```bash
nano /opt/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR=/opt/backups
mkdir -p $BACKUP_DIR
pg_dump -U hailin_user -d hailin > $BACKUP_DIR/db_$DATE.sql
gzip $BACKUP_DIR/db_$DATE.sql
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
```

```bash
chmod +x /opt/backup.sh

# 添加定时任务
crontab -e
# 添加：0 2 * * * /opt/backup.sh >> /var/log/backup.log 2>&1
```

---

## ✅ 检查清单

- [ ] 服务器购买完成
- [ ] Node.js 18安装成功
- [ ] Nginx安装成功
- [ ] PostgreSQL安装成功
- [ ] PM2安装成功
- [ ] 数据库创建成功
- [ ] SSL证书配置成功
- [ ] Nginx配置成功
- [ ] 代码部署成功
- [ ] PM2服务运行中
- [ ] API测试通过
- [ ] 小程序域名配置完成

---

## ⚠️ 常见问题

### Q1: 连接数据库失败
**A**: 检查pg_hba.conf配置，确保允许远程连接

### Q2: SSL证书申请失败
**A**: 确保域名已解析到服务器IP，并等待DNS生效

### Q3: API无法访问
**A**: 检查PM2状态和日志，检查防火墙和Nginx配置

### Q4: 小程序报错"不在合法域名列表"
**A**: 检查小程序服务器域名配置，确保使用HTTPS

---

## 📞 需要帮助？

### 技术文档
- [完整服务器部署方案](./SERVER_DEPLOYMENT_RECOMMENDATION.md)
- [环境变量配置](./.env.example)

### 监控地址
- 服务器状态: https://api.你的域名.com
- PM2监控: `pm2 monit`
- 日志查看: `pm2 logs hailin-api`

---

## 🎉 部署完成

恭喜！服务器部署完成！现在可以：

1. ✅ 小程序配置独立API
2. ✅ 享受更好的性能和稳定性
3. ✅ 完全控制数据和流量
4. ✅ 降低成本（相比扣子平台）

---

**文档版本：v1.0**
**创建时间：2024-04-07**
**维护者：海邻到家技术团队**
