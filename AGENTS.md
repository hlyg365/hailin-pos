# 海邻到家 V2.0 统一跨端架构

## 项目概览

海邻到家是一个面向社区便利店的智能收银与营销管理系统，采用 **Monorepo 统一架构**，实现代码最大复用。

### 架构特点

- **统一代码库**：所有端共享核心业务逻辑
- **跨端框架**：使用 Taro/React 编译到多平台
- **独立部署**：各端可独立构建和部署
- **状态共享**：统一的认证、购物车、会员状态

### 技术栈

| 模块 | 技术选型 |
|------|----------|
| 核心包 | TypeScript, React |
| 收银台 | React + Vite + Tailwind |
| 小程序 | Taro + React |
| 管理后台 | Next.js 16 |
| 店长助手 | Next.js PWA |

## 目录结构

```
hailin-pos/
├── packages/              # 核心业务包（共享）
│   ├── core/             # API客户端、类型、状态管理
│   ├── cart/             # 购物车服务
│   ├── order/            # 订单服务
│   ├── member/           # 会员服务
│   ├── payment/          # 支付服务
│   ├── promotion/        # 促销服务
│   └── hardware/         # 硬件服务
├── apps/                 # 各端应用入口
│   ├── pos-app/          # 收银台 APP
│   ├── mini-store/       # 小程序商城
│   ├── dashboard/        # 总部管理后台
│   └── assistant/        # 店长助手 PWA
└── docs/                 # 文档
```

## 核心包说明

### @hailin/core
基础核心包，包含：
- API 客户端（统一请求/响应处理）
- 认证状态管理
- 店铺上下文
- 工具函数
- 类型定义

```typescript
import { apiClient, useAuthStore, useStoreInfo } from '@hailin/core';

// API 调用
const response = await apiClient.get('/api/products');

// 认证
const { isAuthenticated, login, logout } = useAuthStore();

// 店铺信息
const { store, operator } = useStoreInfo();
```

### @hailin/cart
购物车状态与服务：
- 购物车状态管理
- 商品添加/删除/修改
- 价格计算（含促销）
- 离线持久化

```typescript
import { useCart, useCartActions } from '@hailin/cart';

const { cartItems, subtotal, discount, finalAmount } = useCart();
const { addItem, removeItem, updateQuantity, clearCart } = useCartActions();
```

### @hailin/order
订单全生命周期管理：
- 创建订单
- 支付流程
- 退款处理
- 订单统计

```typescript
import { useOrders, useCurrentOrder } from '@hailin/order';

const { orders, loading, create, pay, cancel } = useOrders();
const { createOrder, payOrder } = useCurrentOrder();
```

### @hailin/member
会员服务体系：
- 会员注册/登录
- 等级折扣计算
- 积分管理
- 会员权益

```typescript
import { useMember, useMemberDiscount } from '@hailin/member';

const { currentMember, login, logout } = useMember();
const { discountRate, levelName, calculatePoints } = useMemberDiscount();
```

### @hailin/payment
支付服务：
- 多支付渠道
- 现金找零计算
- 退款处理
- 日结对账

```typescript
import { usePayment, useCashPayment } from '@hailin/payment';

const { status, qrcode, startPayment } = usePayment();
const { received, change, calculateChange } = useCashPayment();
```

### @hailin/promotion
促销管理：
- 促销规则引擎
- 满减/折扣计算
- 晚8点清货
- 促销统计

```typescript
import { usePromotionCalculator, useClearanceMode } from '@hailin/promotion';

const { results, getTotalDiscount } = usePromotionCalculator();
const { isClearanceMode, calculateClearancePrice } = useClearanceMode();
```

### @hailin/hardware
硬件设备服务：
- 打印机服务（ESC/POS）
- 扫码枪服务
- 钱箱控制
- 电子秤服务

```typescript
import { useHardware, usePrinter, useScanner, useCashbox, useScale } from '@hailin/hardware';

const { printerConnected, scannerConnected } = useHardware();
const { status, print } = usePrinter();
const { startListening, stopListening } = useScanner();
```

## 收银台应用 (pos-app)

### 主要页面

| 页面 | 路由 | 功能 |
|------|------|------|
| 登录 | `/login` | 店铺/操作员认证 |
| 收银台 | `/cashier` | 商品选购、购物车、结算 |
| 会员识别 | `/member` | 扫码/手机号识别会员 |
| 挂单列表 | `/suspended` | 查看/取回挂单 |
| 设置 | `/settings` | 硬件配置、网络状态 |

### 核心功能

1. **商品展示**：支持分类筛选、搜索、扫码添加
2. **购物车**：数量修改、删除、清空
3. **会员折扣**：自动计算会员等级折扣
4. **晚8点清货**：20:00-23:00 自动8折
5. **多种支付**：现金、微信、支付宝
6. **离线支持**：订单本地保存，网络恢复同步

### 硬件集成

```typescript
// 初始化硬件
import { initializeHardware } from '@hailin/hardware';
await initializeHardware();

// 打印小票
await print({
  storeName: '海邻到家',
  orderNo: 'POS20240115001',
  items: [...],
  subtotal: 100,
  discount: 10,
  finalAmount: 90,
});

// 打开钱箱
await openCashbox();
```

## 小程序商城 (mini-store)

待实现功能：
- 商品浏览与搜索
- 购物车
- 会员登录
- 在线支付
- 优惠券核销
- 订单管理

## 总部管理后台 (dashboard)

待实现功能：
- 多门店管理
- 商品管理
- 库存管理
- 会员管理
- 促销管理
- 财务报表
- 系统设置

## 店长助手 PWA (assistant)

待实现功能：
- 移动收银
- 库存盘点
- 数据报表
- 采购申请
- 促销申请

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
