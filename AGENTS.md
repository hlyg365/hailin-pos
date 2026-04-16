# 海邻到家 V2.0 统一跨端架构

## 项目概览

海邻到家是一个面向社区便利店的智能收银与营销管理系统，采用 **Monorepo 统一架构**，实现代码最大复用。系统包含四个核心终端：

| 终端 | 路由 | 技术栈 | 功能定位 |
|------|------|--------|----------|
| 收银台APP | `/pos/*` | React + Vite | 门店快速收银、硬件集成 |
| 小程序商城 | `/mini/*` | Taro + React | 商品浏览、团购接龙、线上销售 |
| 总部管理后台 | `/dashboard/*` | Next.js | 多门店管理、数据分析 |
| 店长助手 | `/assistant/*` | Next.js PWA | 移动端管理、库存盘点 |

## 架构特点

- **统一代码库**：所有端共享核心业务逻辑
- **跨端框架**：使用 Taro/React 编译到多平台
- **独立部署**：各端可独立构建和部署
- **状态共享**：统一的认证、购物车、会员状态

## 技术栈

| 模块 | 技术选型 |
|------|----------|
| 核心包 | TypeScript, React, Zustand |
| 收银台 | React + Vite + Tailwind |
| 小程序 | Taro + React (编译到微信/H5) |
| 管理后台 | Next.js 14 (App Router) |
| 店长助手 | Next.js 14 PWA |

## 目录结构

```
/workspace/projects/
├── packages/              # 核心业务包（共享）
│   ├── core/             # API客户端、类型、状态管理
│   ├── cart/             # 购物车服务
│   ├── order/            # 订单服务
│   ├── member/           # 会员服务
│   ├── payment/          # 支付服务
│   ├── promotion/        # 促销服务
│   └── hardware/         # 硬件服务
├── apps/                 # 各端应用入口
│   ├── pos-app/          # 收银台 APP (端口5000)
│   ├── mini-store/       # 小程序商城
│   ├── dashboard/        # 总部管理后台
│   └── assistant/        # 店长助手 PWA (端口5001)
├── package.json          # Monorepo 根配置
└── pnpm-workspace.yaml   # 工作区配置
```

## 核心包说明

### @hailin/core
基础核心包，包含：
- API 客户端（统一请求/响应处理）
- 认证状态管理
- 店铺上下文
- 工具函数
- 类型定义

### @hailin/cart
购物车状态与服务：
- 购物车状态管理
- 商品添加/删除/修改
- 价格计算（含促销）
- 离线持久化

### @hailin/order
订单全生命周期管理：
- 创建订单
- 支付流程
- 退款处理
- 订单统计

### @hailin/member
会员服务体系：
- 会员注册/登录
- 等级折扣计算（普通/银卡/金卡/钻石）
- 积分管理
- 会员权益

### @hailin/payment
支付服务：
- 多支付渠道（现金/微信/支付宝/会员卡）
- 现金找零计算
- 退款处理
- 日结对账

### @hailin/promotion
促销管理：
- 促销规则引擎
- 满减/折扣计算
- **晚8点清货**：20:00-23:00 自动8折
- 促销统计

### @hailin/hardware
硬件设备服务：
- 打印机服务（ESC/POS）
- 扫码枪服务（USB/蓝牙）
- 钱箱控制
- 电子秤服务

## 各端详情

### 收银台 APP (pos-app)

**访问路径**: `http://localhost:5000`

**页面**:
- `/login` - 店铺/操作员认证
- `/cashier` - 商品选购、购物车、结算
- `/member` - 扫码/手机号识别会员
- `/suspended` - 查看/取回挂单
- `/settings` - 硬件配置、网络状态

**核心功能**:
1. 商品展示：分类筛选、搜索、扫码添加
2. 购物车：数量修改、删除、清空
3. 会员折扣：自动计算会员等级折扣
4. 晚8点清货：20:00-23:00 自动8折
5. 多种支付：现金、微信、支付宝
6. 离线支持：订单本地保存，网络恢复同步

### 小程序商城 (mini-store)

**页面**:
- 首页 - 商品列表、搜索、分类
- 购物车 - 商品管理、结算
- 我的 - 会员中心、订单
- **团购接龙** - 团长发起、参与者加入

**团购接龙功能**:
- 团长发起团购，设置人数、价格、截止时间
- 生成分享链接/海报
- 实时显示已参与人数
- 拼团成功后到店核销

### 总部管理后台 (dashboard)

**访问路径**: `http://localhost:5000/dashboard`

**页面**:
- `/` - 工作台（统计概览、销售趋势）
- `/stores` - 门店管理（新增、编辑、状态）
- `/products` - 商品管理（新增、编辑、调价）
- `/orders` - 订单管理（查询、退款）
- `/members` - 会员管理（等级、积分）
- `/promotions` - 促销管理（创建、审核）
- `/reports` - 数据报表（销售、库存）
- `/settings` - 系统设置

### 店长助手 PWA (assistant)

**访问路径**: `http://localhost:5001`

**页面**:
- `/` - 首页（今日统计、待处理提醒、库存预警）
- `/inventory` - 库存管理（查看、调整、补货）
- `/inventory/check` - 库存盘点
- `/report` - 数据报表（销售趋势、热销商品）
- `/settings` - 设置

**PWA特性**:
- 可添加到主屏幕
- 离线访问
- 推送通知
- 移动端优化

## 开发指南

### 安装依赖

```bash
# 安装所有依赖
pnpm install

# 安装特定包
pnpm add @hailin/core -w
```

### 开发模式

```bash
# 收银台
pnpm dev

# 管理后台
pnpm dev:dashboard

# 店长助手
pnpm dev:assistant
```

### 构建

```bash
# 构建所有
pnpm build

# 构建指定应用
pnpm build:pos
pnpm build:dashboard
pnpm build:assistant
```

## API 接口

### 认证接口
- `POST /api/auth/login` - 登录
- `POST /api/auth/logout` - 登出
- `GET /api/auth/current` - 当前用户

### 商品接口
- `GET /api/products` - 商品列表
- `GET /api/products/:id` - 商品详情
- `POST /api/products/barcode` - 条码查询

### 订单接口
- `POST /api/orders` - 创建订单
- `POST /api/orders/:id/pay` - 支付订单
- `POST /api/orders/:id/cancel` - 取消订单
- `GET /api/orders` - 订单列表

### 会员接口
- `POST /api/members/register` - 注册会员
- `POST /api/members/login` - 会员登录
- `POST /api/members/verify-code` - 验证会员码
- `GET /api/members/:id` - 会员详情

### 支付接口
- `POST /api/payments/create` - 创建支付
- `GET /api/payments/query/:orderId` - 查询支付状态
- `POST /api/payments/refund` - 申请退款

### 促销接口
- `GET /api/promotions` - 促销列表
- `GET /api/promotions/available` - 可用促销
- `POST /api/promotions/calculate` - 计算优惠

## 会员等级

| 等级 | 折扣 | 积分倍率 | 升级门槛 |
|------|------|----------|----------|
| 普通会员 | 原价 | 1倍 | 0元 |
| 银卡会员 | 98折 | 1.2倍 | 1000元 |
| 金卡会员 | 95折 | 1.5倍 | 5000元 |
| 钻石会员 | 9折 | 2倍 | 20000元 |

## 硬件协议

### 打印机 ESC/POS

```typescript
// 初始化
const ESC = 0x1B;
const GS = 0x1D;

// 打印文本
[ESC, 0x40]                    // 初始化
[ESC, 0x61, 0x01]              // 居中
text                           // 文本
[0x0A]                         // 换行

// 切纸
[GS, 0x56, 0x00]               // 全切
[GS, 0x56, 0x01]               // 半切
```

### 钱箱控制

```typescript
// 打开钱箱脉冲
[ESC, 0x70, 0x00, 0x19, 0xFA]
```

## 更新日志

### 2024-01-15 V2.0

- 采用 Monorepo 架构重构
- 核心业务逻辑提取为独立包
- 各端共享统一状态管理
- 完善的硬件抽象层
- 支持离线模式
- 新增团购接龙功能
- PWA 店长助手
