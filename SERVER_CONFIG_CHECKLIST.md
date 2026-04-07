# 服务器部署配置清单

## 📋 必填配置（部署前必须填写）

### 1. 域名配置
```env
# API域名（已备案）
API_DOMAIN=api.hailin.com

# 前端域名
WEB_DOMAIN=hailin.com

# CDN域名
CDN_DOMAIN=cdn.hailin.com
```

### 2. 数据库配置
```env
# 数据库连接信息（来自第3步配置）
DATABASE_URL=postgresql://hailin_user:你的密码@localhost:5432/hailin

# 数据库连接参数
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hailin
DB_USER=hailin_user
DB_PASSWORD=你的强密码
```

### 3. 微信配置
```env
# 小程序配置（来自微信公众平台）
WECHAT_APP_ID=wx1234567890abcdef
WECHAT_APP_SECRET=你的小程序Secret

# 微信支付配置（来自微信支付商户平台）
WECHAT_MCH_ID=1234567890
WECHAT_MCH_KEY=你的32位API密钥
WECHAT_MCH_CERT_PATH=/var/www/hailin/cert/apiclient_cert.p12
WECHAT_MCH_CERT_PASSWORD=你的商户号
```

---

## 🔧 服务器信息（部署前填写）

```env
# 服务器IP
SERVER_IP=你的服务器IP

# SSH端口
SSH_PORT=22

# 服务器用户名
SERVER_USER=root

# 项目路径
PROJECT_PATH=/var/www/hailin
```

---

## 📊 数据库表结构（PostgreSQL）

### 创建数据库脚本

```sql
-- 创建商品表
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0,
    category VARCHAR(100),
    barcode VARCHAR(50),
    image_url TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建会员表
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    level VARCHAR(20) DEFAULT 'normal',
    points INTEGER DEFAULT 0,
    balance DECIMAL(10, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建订单表
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no VARCHAR(50) UNIQUE NOT NULL,
    member_id UUID REFERENCES members(id),
    total_amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    pay_amount DECIMAL(10, 2) NOT NULL,
    pay_method VARCHAR(20),
    pay_status VARCHAR(20) DEFAULT 'pending',
    order_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建订单明细表
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    product_id UUID REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建接龙表
CREATE TABLE chains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    end_time TIMESTAMP,
    creator_id UUID REFERENCES members(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建接龙参与表
CREATE TABLE chain_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id UUID REFERENCES chains(id),
    member_id UUID REFERENCES members(id),
    name VARCHAR(100),
    phone VARCHAR(20),
    quantity INTEGER DEFAULT 1,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_members_phone ON members(phone);
CREATE INDEX idx_orders_order_no ON orders(order_no);
CREATE INDEX idx_orders_member_id ON orders(member_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_chains_status ON chains(status);
CREATE INDEX idx_chain_participants_chain_id ON chain_participants(chain_id);
```

---

## 🌐 Nginx完整配置

```nginx
# /etc/nginx/sites-available/api.hailin.com

upstream hailin_backend {
    server 127.0.0.1:5000;
    keepalive 64;
}

# HTTP重定向到HTTPS
server {
    listen 80;
    server_name api.hailin.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS配置
server {
    listen 443 ssl http2;
    server_name api.hailin.com;

    # SSL证书（Let's Encrypt）
    ssl_certificate /etc/letsencrypt/live/api.hailin.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.hailin.com/privkey.pem;
    
    # SSL优化
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml application/xml+rss text/javascript application/vnd.ms-fontobject application/x-font-ttf font/opentype image/svg+xml image/x-icon;

    # 日志
    access_log /var/log/nginx/api.hailin.com.access.log;
    error_log /var/log/nginx/api.hailin.com.error.log;

    # 上传文件大小限制
    client_max_body_size 10M;
    client_body_timeout 60s;
    client_header_timeout 60s;

    # 超时设置
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # API代理
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
    }

    # API健康检查
    location /api/health {
        proxy_pass http://hailin_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }

    # 静态文件（如果有）
    location /static {
        alias /var/www/hailin/public;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

---

## 🔐 PM2配置

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
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
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/log/pm2/hailin-error.log',
      out_file: '/var/log/pm2/hailin-out.log',
      log_file: '/var/log/pm2/hailin-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 4000,
      kill_timeout: 5000,
      listen_timeout: 3000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
```

---

## 📝 环境变量完整模板

```env
# ==================== 基础配置 ====================
NODE_ENV=production
PORT=5000
APP_NAME=海邻到家
APP_VERSION=1.0.0
TZ=Asia/Shanghai

# ==================== 域名配置 ====================
BASE_URL=https://api.hailin.com
API_DOMAIN=api.hailin.com

# ==================== 数据库配置 ====================
DATABASE_URL=postgresql://hailin_user:你的密码@localhost:5432/hailin
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hailin
DB_USER=hailin_user
DB_PASSWORD=你的强密码

# ==================== 微信小程序配置 ====================
WECHAT_APP_ID=wx1234567890abcdef
WECHAT_APP_SECRET=你的小程序Secret

# ==================== 微信支付配置 ====================
WECHAT_MCH_ID=1234567890
WECHAT_MCH_KEY=你的32位API密钥
WECHAT_MCH_CERT_PATH=/var/www/hailin/cert/apiclient_cert.p12
WECHAT_MCH_CERT_PASSWORD=你的商户号

# ==================== JWT配置 ====================
JWT_SECRET=你的32位以上随机字符串
JWT_EXPIRES_IN=720

# ==================== 对象存储配置 ====================
AWS_ACCESS_KEY_ID=你的AccessKey
AWS_SECRET_ACCESS_KEY=你的SecretKey
AWS_REGION=cn-hangzhou
AWS_BUCKET=hailin-images

# ==================== 日志配置 ====================
LOG_LEVEL=info
LOG_DIR=/var/log/hailin
```

---

## 🔄 数据迁移脚本

```bash
#!/bin/bash
# 数据迁移脚本

# 1. 导出扣子平台数据（JSON格式）
# 在扣子平台导出数据到本地

# 2. 转换数据格式（JSON to CSV）
# 使用Python或Node.js脚本转换

# 3. 导入到PostgreSQL
psql -U hailin_user -d hailin -c "\copy products FROM 'products.csv' CSV HEADER;"
psql -U hailin_user -d hailin -c "\copy members FROM 'members.csv' CSV HEADER;"
psql -U hailin_user -d hailin -c "\copy orders FROM 'orders.csv' CSV HEADER;"

# 4. 验证数据
psql -U hailin_user -d hailin -c "SELECT COUNT(*) FROM products;"
psql -U hailin_user -d hailin -c "SELECT COUNT(*) FROM members;"
psql -U hailin_user -d hailin -c "SELECT COUNT(*) FROM orders;"
```

---

## 📊 监控命令

```bash
# 查看服务状态
pm2 status

# 查看实时日志
pm2 logs hailin-api --lines 100 --nostream

# 查看资源使用
pm2 monit

# 查看详细日志
pm2 logs hailin-api --err --lines 50

# 重启服务
pm2 restart hailin-api

# 停止服务
pm2 stop hailin-api

# 删除服务
pm2 delete hailin-api

# 查看nginx状态
sudo systemctl status nginx

# 查看nginx日志
sudo tail -f /var/log/nginx/api.hailin.com.access.log

# 查看系统资源
htop

# 查看磁盘使用
df -h

# 查看内存使用
free -h

# 查看进程
ps aux | grep node
```

---

## 🚨 紧急故障处理

### 服务无法启动
```bash
# 查看错误日志
pm2 logs hail2-api --err

# 检查端口占用
lsof -i :5000

# 检查配置文件
cat /var/www/hailin/.env

# 手动启动测试
cd /var/www/hailin
node node_modules/next/dist/bin/next start -p 5000
```

### 数据库连接失败
```bash
# 检查PostgreSQL状态
sudo systemctl status postgresql

# 检查连接
psql -U hailin_user -d hailin -h localhost

# 检查pg_hba.conf
sudo cat /etc/postgresql/14/main/pg_hba.conf
```

### SSL证书过期
```bash
# 更新证书
sudo certbot renew

# 手动更新
sudo certbot certonly --nginx -d api.hailin.com
```

### Nginx无法启动
```bash
# 检查配置语法
sudo nginx -t

# 查看错误日志
sudo cat /var/log/nginx/error.log

# 重启Nginx
sudo systemctl restart nginx
```

---

**文档版本：v1.0**
**创建时间：2024-04-07**
**维护者：海邻到家技术团队**
