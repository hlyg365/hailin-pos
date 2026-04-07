# 扣子平台 + 服务器混合部署方案

## 📋 当前架构分析

### 现有资源
- ✅ 微信公众号（已认证）
- ✅ 微信小程序（已注册）
- ✅ 域名（已备案）
- ✅ 扣子平台（当前运行）

### 架构选择

```
┌─────────────────────────────────────────────────────────────┐
│                        用户端                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐            │
│   │  小程序   │    │   APP    │    │  公众号   │            │
│   │  (商城)  │    │  (收银台) │    │  (入口)  │            │
│   └────┬─────┘    └────┬─────┘    └────┬─────┘            │
│        │               │               │                   │
│        └───────────────┴───────────────┘                   │
│                        │                                    │
│                        ▼                                    │
│              ┌─────────────────────┐                        │
│              │   扣子平台 (API)     │                        │
│              │   localhost:5000    │                        │
│              └─────────┬───────────┘                        │
│                        │                                    │
│                        │ HTTPS                              │
│                        ▼                                    │
│              ┌─────────────────────┐                        │
│              │   反向代理 (Nginx)  │                        │
│              │   api.hailin.com   │                        │
│              └─────────┬───────────┘                        │
│                        │                                    │
│                        ▼                                    │
│              ┌─────────────────────┐                        │
│              │     数据库服务        │                        │
│              │   (PostgreSQL)      │                        │
│              └─────────────────────┘                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 推荐方案：渐进式迁移

### 方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **纯扣子平台** | 部署简单、无运维成本 | 功能受限、数据在美国 | 快速验证 |
| **混合部署** | 灵活、渐进迁移 | 需要维护服务器 | 长期运营 |
| **纯服务器部署** | 完全可控、功能完整 | 运维成本高 | 企业级应用 |

### 推荐：混合部署方案

```
阶段1: 当前状态
┌─────────────┐     ┌─────────────┐
│   小程序    │────▶│  扣子平台   │
│             │     │  (Next.js) │
└─────────────┘     └─────────────┘

阶段2: 短期（1-3月）
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   小程序    │────▶│  扣子平台   │────▶│   数据库    │
│             │     │  (Next.js) │     │ (独立服务)  │
└─────────────┘     └─────────────┘     └─────────────┘

阶段3: 长期（3-6月）
┌─────────────┐     ┌─────────────┐
│   小程序    │────▶│   Nginx     │
│             │     │ (反向代理)  │
└─────────────┘     └──────┬──────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
    ┌─────────────────┐         ┌─────────────────┐
    │   收银台API     │         │   商城API       │
    │   (独立服务)    │         │   (独立服务)    │
    └─────────────────┘         └─────────────────┘
              │                           │
              └─────────────┬─────────────┘
                            │
                            ▼
                  ┌─────────────────┐
                  │     数据库       │
                  │   (PostgreSQL)  │
                  └─────────────────┘
```

---

## 🔧 服务器部署建议

### 1. 最小服务器配置

**推荐配置**：
- **CPU**: 2核
- **内存**: 4GB
- **硬盘**: 80GB SSD
- **带宽**: 5Mbps
- **系统**: Ubuntu 22.04 LTS

**费用估算**: 100-200元/月

**服务商推荐**:
- 阿里云ECS（推荐）
- 腾讯云CVM
- 华为云ECS

### 2. 必装软件

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

# 安装Docker（可选）
curl -fsSL https://get.docker.com | sudo sh
```

### 3. Nginx配置

```nginx
# /etc/nginx/sites-available/api.hailin.com

upstream hailin_backend {
    server 127.0.0.1:5000;
    keepalive 64;
}

server {
    listen 80;
    server_name api.hailin.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.hailin.com;

    # SSL配置
    ssl_certificate /etc/nginx/ssl/api.hailin.com.crt;
    ssl_certificate_key /etc/nginx/ssl/api.hailin.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript;

    # 日志
    access_log /var/log/nginx/api.hailin.com.access.log;
    error_log /var/log/nginx/api.hailin.com.error.log;

    location / {
        proxy_pass http://hailin_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态文件（如果有）
    location /static {
        alias /var/www/hailin/static;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 上传文件大小限制
    client_max_body_size 10M;
}
```

### 4. 数据库配置

```bash
# 切换到postgres用户
sudo -u postgres psql

# 创建数据库
CREATE DATABASE hailin;
CREATE USER hailin_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE hailin TO hailin_user;

# 允许远程连接（可选）
# 编辑 /etc/postgresql/14/main/pg_hba.conf
host all all 0.0.0.0/0 md5

# 编辑 /etc/postgresql/14/main/postgresql.conf
listen_addresses = '*'

# 重启PostgreSQL
sudo systemctl restart postgresql
```

### 5. PM2部署脚本

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'hailin-api',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 5000',
    cwd: '/var/www/hailin',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/pm2/hailin-error.log',
    out_file: '/var/log/pm2/hailin-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    restart_delay: 4000
  }]
};
```

### 6. 部署命令

```bash
# 创建目录
sudo mkdir -p /var/www/hailin
sudo mkdir -p /var/log/pm2

# 上传代码
# scp -r ./hailin-code user@server:/var/www/hailin

# 安装依赖
cd /var/www/hailin
pnpm install

# 创建环境变量
cp .env.example .env
nano .env  # 填写实际配置

# 构建项目
pnpm build

# 启动服务
pm2 start ecosystem.config.js

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup
```

---

## 🔄 数据迁移方案

### 扣子平台数据导出

当前扣子平台的数据存储：
- 商品数据
- 订单数据
- 会员数据
- 接龙数据

### 迁移步骤

```bash
# 1. 导出扣子平台数据
# - 导出商品数据为JSON
# - 导出订单数据为JSON
# - 导出会员数据为JSON

# 2. 转换数据格式
# - 转换为PostgreSQL可导入的CSV格式

# 3. 导入到新数据库
psql -U hailin_user -d hailin -c "\copy products FROM 'products.csv' CSV HEADER;"
psql -U hailin_user -d hailin -c "\copy orders FROM 'orders.csv' CSV HEADER;"
psql -U hailin_user -d hailin -c "\copy members FROM 'members.csv' CSV HEADER;"

# 4. 验证数据
psql -U hailin_user -d hailin -c "SELECT COUNT(*) FROM products;"
```

---

## 🔐 安全配置

### 防火墙配置

```bash
# 安装UFW
sudo apt install ufw

# 配置规则
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https

# 启用防火墙
sudo ufw enable
```

### SSL证书配置

```bash
# 使用Let's Encrypt免费证书
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d api.hailin.com

# 自动续期
sudo certbot renew --dry-run
```

### 定期备份

```bash
# 创建备份脚本 /opt/backup.sh
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR=/opt/backups
DB_NAME=hailin
DB_USER=hailin_user

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
pg_dump -U $DB_USER -d $DB_NAME > $BACKUP_DIR/db_$DATE.sql

# 压缩备份
gzip $BACKUP_DIR/db_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

# 上传到对象存储（可选）
# aws s3 cp $BACKUP_DIR/db_$DATE.sql.gz s3://hailin-backups/
```

### 定时任务

```bash
# 编辑定时任务
crontab -e

# 每天凌晨2点执行备份
0 2 * * * /opt/backup.sh >> /var/log/backup.log 2>&1

# 每周日凌晨3点重启服务
0 3 * * 0 pm2 restart hailin-api
```

---

## 📊 监控方案

### 1. PM2监控

```bash
# 查看服务状态
pm2 status

# 查看实时日志
pm2 logs hailin-api --lines 100

# 查看监控面板
pm2 monit
```

### 2. Nginx监控

```bash
# 查看访问日志
tail -f /var/log/nginx/api.hailin.com.access.log

# 查看错误日志
tail -f /var/log/nginx/api.hailin.com.error.log
```

### 3. 系统监控

```bash
# 安装htop
sudo apt install htop

# 查看系统资源
htop

# 查看磁盘使用
df -h

# 查看内存使用
free -h
```

### 4. 日志管理

```bash
# 配置日志轮转 /etc/logrotate.d/hailin
/var/log/nginx/api.hailin.com.*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}

/var/log/pm2/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 0640 root root
}
```

---

## 🚀 渐进式迁移策略

### 第一阶段：准备（1周）

**目标**: 建立服务器环境，测试API

- [ ] 购买并配置服务器
- [ ] 安装必要的软件
- [ ] 配置Nginx和SSL
- [ ] 部署测试版本
- [ ] 测试API接口

### 第二阶段：灰度（2周）

**目标**: 部分流量切换到服务器

- [ ] 部署正式版本
- [ ] 配置双线解析
- [ ] 10%流量切换到服务器
- [ ] 监控运行状态
- [ ] 收集问题反馈

### 第三阶段：全量（1周）

**目标**: 全部流量切换到服务器

- [ ] 100%流量切换
- [ ] 停止扣子平台服务
- [ ] 验证所有功能
- [ ] 完善监控报警

### 第四阶段：优化（持续）

**目标**: 性能优化和功能完善

- [ ] 性能优化
- [ ] 安全加固
- [ ] 功能迭代
- [ ] 数据分析

---

## 📋 检查清单

### 服务器准备
- [ ] 服务器购买完成
- [ ] 域名解析配置
- [ ] SSL证书申请
- [ ] Nginx配置完成
- [ ] 数据库配置完成
- [ ] PM2部署完成
- [ ] 防火墙配置完成
- [ ] 备份策略配置完成
- [ ] 监控配置完成

### 代码准备
- [ ] 环境变量配置
- [ ] 数据库连接配置
- [ ] API地址配置
- [ ] 小程序服务器域名配置

### 测试准备
- [ ] API功能测试
- [ ] 小程序联调测试
- [ ] 支付功能测试
- [ ] 性能测试
- [ ] 安全测试

---

## 💰 成本估算

### 月度成本
| 项目 | 费用 | 说明 |
|------|------|------|
| 服务器 | 100-200元 | 2核4G SSD |
| 域名 | 5-20元 | .com域名 |
| 流量 | 0-100元 | 5Mbps带宽 |
| SSL | 免费 | Let's Encrypt |
| **合计** | **约200-400元/月** | |

### 年度成本
| 项目 | 费用 | 说明 |
|------|------|------|
| 服务器 | 1200-2400元 | 按年付费 |
| 域名 | 60-240元 | 按年付费 |
| 流量 | 0-1200元 | 视情况 |
| **合计** | **约2000-4000元/年** | |

---

## 📞 技术支持

### 文档
- [扣子平台部署指南](./COZE_DEPLOYMENT.md)
- [服务器部署指南](./SERVER_DEPLOYMENT.md)
- [API文档](./API_DOCS.md)

### 监控地址
- 扣子平台: https://api.coze.cn
- 服务器: https://api.hailin.com

---

**文档版本：v1.0**
**创建时间：2024-04-07**
**维护者：海邻到家技术团队**
