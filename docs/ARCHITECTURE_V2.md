# 海邻到家系统架构重构方案 V2.0

## 一、当前架构问题分析

### 1.1 现存问题

| 问题 | 表现 | 影响 |
|------|------|------|
| **代码重复** | 收银台、小程序、管理后台各自独立代码 | 维护成本高，修改一处需改多处 |
| **技术栈碎片化** | 不同模块可能使用不同开发方式 | 学习成本高，团队协作困难 |
| **升级困难** | 各端独立升级，风险高 | 线上问题修复慢 |
| **数据不一致** | 多端数据可能不同步 | 用户体验差 |
| **硬件集成复杂** | 收银台需要原生能力 | APP和H5行为不一致 |

### 1.2 问题根源

```
┌─────────────────────────────────────────────────────────┐
│                     当前架构                              │
├─────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │  收银台  │  │  小程序  │  │  PWA   │  │  管理后台 │     │
│  │  (Next) │  │  (原生)  │  │ (Next) │  │  (Next)  │     │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘     │
│       │            │            │            │          │
│       └────────────┴─────┬──────┴────────────┘          │
│                          ▼                              │
│                   [ 独立维护 ]                           │
│                   各端代码不同步                          │
└─────────────────────────────────────────────────────────┘
```

---

## 二、重构目标

### 2.1 核心目标

1. **一套代码，多端运行** - 业务逻辑统一维护
2. **数据实时同步** - 用户旅程无缝衔接
3. **高效迭代** - 一次开发，全端生效
4. **稳定可靠** - 统一测试，质量可控

### 2.2 架构原则

- **API First** - 所有能力通过API暴露
- **模块化** - 业务逻辑独立，可复用
- **平台适配** - UI层按平台差异化
- **渐进式** - 可逐步迁移，不影响现有业务

---

## 三、推荐技术栈

### 3.1 核心框架组合

```
┌─────────────────────────────────────────────────────────┐
│                    推荐技术栈                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │           Taro (跨端框架)                        │   │
│   │   React/Vue语法 → 小程序 + H5 + APP             │   │
│   └─────────────────────────────────────────────────┘   │
│                          │                              │
│   ┌──────────────────────┼──────────────────────┐      │
│   │                      │                      │      │
│   ▼                      ▼                      ▼      │
│ ┌──────┐          ┌──────────┐           ┌─────────┐  │
│ │小程序│          │  Web/PWA │           │ APP     │  │
│ │原生  │          │  Next.js │           │ReactNat │  │
│ └──────┘          └──────────┘           └─────────┘  │
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │              统一业务层 (Taro Store)              │   │
│   │  商品 | 订单 | 会员 | 支付 | 库存 | 营销         │   │
│   └─────────────────────────────────────────────────┘   │
│                          │                              │
│                          ▼                              │
│   ┌─────────────────────────────────────────────────┐   │
│   │              统一 API 服务层                       │   │
│   │         RESTful / GraphQL / tRPC                 │   │
│   └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.2 技术选型对比

| 方案 | 代码复用 | APP体验 | 学习成本 | 硬件支持 | 推荐度 |
|------|---------|---------|---------|---------|--------|
| **Taro + React Native** | ★★★★★ | ★★★★ | ★★★ | ★★★★ | ⭐⭐⭐⭐⭐ |
| Next.js + Ionic + Capacitor | ★★★ | ★★★★ | ★★★ | ★★★ | ⭐⭐⭐ |
| 纯原生开发 | ★ | ★★★★★ | ★ | ★★★★★ | ⭐⭐ |
| uni-app | ★★★★ | ★★★ | ★★★ | ★★★ | ⭐⭐⭐⭐ |

---

## 四、新架构设计

### 4.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户层                                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │  收银台   │  │  小程序   │  │  Web/PWA │  │   管理后台   │    │
│  │  Taro    │  │  Taro    │  │  Taro    │  │   Next.js   │    │
│  │  RN App  │  │  微信     │  │  浏览器   │  │   React     │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘    │
│       │             │             │               │            │
│       └─────────────┴──────┬──────┴───────────────┘            │
│                            │                                    │
│                            ▼                                    │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    统一业务层 (Business Layer)           │   │
│   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐│   │
│   │  │商品服务 │ │订单服务 │ │会员服务 │ │ 供应链服务     ││   │
│   │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘│   │
│   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐│   │
│   │  │支付服务 │ │促销服务 │ │报表服务 │ │ 硬件设备服务   ││   │
│   │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘│   │
│   └─────────────────────────────────────────────────────────┘   │
│                            │                                    │
│                            ▼                                    │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    API 网关层 (Gateway)                  │   │
│   │         认证鉴权 | 限流熔断 | 路由分发 | 监控日志          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         后端服务层                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ 用户服务  │  │ 商品服务  │  │ 订单服务  │  │ 支付服务  │       │
│  │  Node.js │  │  Node.js │  │  Node.js │  │  Node.js │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ 会员服务  │  │ 促销服务  │  │ 报表服务  │  │ 消息服务  │       │
│  │  Node.js │  │  Node.js │  │  Node.js │  │  Node.js │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         数据层                                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ PostgreSQL│ │  Redis   │  │  OSS    │  │ 监控系统  │       │
│  │  主数据库 │  │ 缓存/会话 │  │ 文件存储 │  │  日志    │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 项目目录结构

```
hailin-unified/
├── .gitignore
├── package.json
├── README.md
│
├── # 核心业务层（所有端共享）
├── packages/
│   │
│   ├── # 业务逻辑包
│   ├── core/                      # 核心模块
│   │   ├── src/
│   │   │   ├── api/              # API客户端封装
│   │   │   │   ├── request.ts    # 请求拦截器
│   │   │   │   ├── response.ts   # 响应处理
│   │   │   │   └── index.ts
│   │   │   ├── store/            # 状态管理
│   │   │   │   ├── index.ts
│   │   │   │   └── persist.ts    # 持久化
│   │   │   ├── types/            # 类型定义
│   │   │   │   ├── product.ts
│   │   │   │   ├── order.ts
│   │   │   │   ├── member.ts
│   │   │   │   └── index.ts
│   │   │   ├── utils/            # 工具函数
│   │   │   │   ├── format.ts
│   │   │   │   ├── validate.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── # 商品模块
│   ├── product/
│   │   ├── src/
│   │   │   ├── services/         # 商品服务
│   │   │   │   ├── getProduct.ts
│   │   │   │   ├── searchProducts.ts
│   │   │   │   └── index.ts
│   │   │   ├── hooks/           # 商品相关Hooks
│   │   │   │   ├── useProduct.ts
│   │   │   │   └── index.ts
│   │   │   ├── components/       # 商品组件
│   │   │   │   ├── ProductCard.tsx
│   │   │   │   ├── ProductList.tsx
│   │   │   │   └── index.ts
│   │   │   └── types/           # 模块类型
│   │   └── package.json
│   │
│   ├── # 订单模块
│   ├── order/
│   │   ├── src/
│   │   │   ├── services/
│   │   │   ├── hooks/
│   │   │   ├── components/
│   │   │   └── types/
│   │   └── package.json
│   │
│   ├── # 会员模块
│   ├── member/
│   │   ├── src/
│   │   │   ├── services/
│   │   │   ├── hooks/
│   │   │   ├── components/
│   │   │   └── types/
│   │   └── package.json
│   │
│   ├── # 购物车模块
│   ├── cart/
│   │   ├── src/
│   │   │   ├── services/         # 购物车服务
│   │   │   │   ├── addToCart.ts
│   │   │   │   ├── removeFromCart.ts
│   │   │   │   ├── updateQuantity.ts
│   │   │   │   ├── clearCart.ts
│   │   │   │   └── index.ts
│   │   │   ├── hooks/           # 购物车Hooks
│   │   │   │   ├── useCart.ts
│   │   │   │   ├── useCartTotal.ts
│   │   │   │   └── index.ts
│   │   │   ├── components/       # 购物车组件
│   │   │   │   ├── CartItem.tsx
│   │   │   │   ├── CartList.tsx
│   │   │   │   ├── CartSummary.tsx
│   │   │   │   └── index.ts
│   │   │   └── types/
│   │   └── package.json
│   │
│   ├── # 支付模块
│   ├── payment/
│   │   ├── src/
│   │   │   ├── services/
│   │   │   ├── hooks/
│   │   │   └── types/
│   │   └── package.json
│   │
│   ├── # 促销模块
│   ├── promotion/
│   │   ├── src/
│   │   │   ├── services/
│   │   │   ├── hooks/
│   │   │   ├── components/
│   │   │   │   ├── CouponCard.tsx
│   │   │   │   ├── PromotionBanner.tsx
│   │   │   │   └── index.ts
│   │   │   └── types/
│   │   └── package.json
│   │
│   └── # 硬件模块（收银台专用）
│   ├── hardware/
│       ├── src/
│       │   ├── services/
│       │   │   ├── printer.ts     # 打印机服务
│       │   │   ├── scanner.ts    # 扫码枪服务
│       │   │   ├── cashbox.ts    # 钱箱服务
│       │   │   ├── scale.ts      # 电子秤服务
│       │   │   └── index.ts
│       │   ├── hooks/
│       │   │   ├── usePrinter.ts
│       │   │   ├── useScanner.ts
│       │   │   ├── useCashbox.ts
│       │   │   ├── useScale.ts
│       │   │   └── index.ts
│       │   ├── components/
│       │   │   ├── HardwarePanel.tsx
│       │   │   ├── PrinterStatus.tsx
│       │   │   ├── ScannerTest.tsx
│       │   │   └── index.ts
│       │   └── types/
│       └── package.json
│
├── # 应用入口（各端独立）
├── apps/
│   │
│   ├── # 小程序端
│   ├── miniapp/
│   │   ├── src/
│   │   │   ├── pages/           # 页面
│   │   │   │   ├── index/
│   │   │   │   ├── categories/
│   │   │   │   ├── cart/
│   │   │   │   ├── orders/
│   │   │   │   └── user/
│   │   │   ├── app.ts
│   │   │   └── app.config.ts
│   │   ├── config/index.ts      # Taro配置
│   │   └── package.json
│   │
│   ├── # Web/PWA端
│   ├── web/
│   │   ├── src/
│   │   │   ├── pages/           # 页面（Next.js）
│   │   │   ├── components/       # Web特有组件
│   │   │   ├── app/layout.tsx
│   │   │   └── app/page.tsx
│   │   ├── next.config.js
│   │   └── package.json
│   │
│   ├── # 收银台端
│   ├── pos/
│   │   ├── src/
│   │   │   ├── pages/           # 收银台页面
│   │   │   │   ├── index/
│   │   │   │   ├── cashier/
│   │   │   │   ├── products/
│   │   │   │   ├── members/
│   │   │   │   ├── reports/
│   │   │   │   └── settings/
│   │   │   ├── components/       # 收银台特有组件
│   │   │   │   ├── CashierPanel.tsx
│   │   │   │   ├── ProductGrid.tsx
│   │   │   │   ├── PaymentDialog.tsx
│   │   │   │   └── index.ts
│   │   │   ├── app.config.ts
│   │   │   └── app.tsx
│   │   ├── config/index.ts      # Taro配置
│   │   └── package.json
│   │
│   └── # 管理后台端
│   ├── admin/
│       ├── src/
│       │   ├── pages/           # 管理后台页面
│       │   ├── components/       # 管理后台特有组件
│       │   ├── app.config.ts
│       │   └── app.tsx
│       ├── next.config.js
│       └── package.json
│
├── # API服务（Node.js后端）
├── server/
│   ├── src/
│   │   ├── routes/              # 路由
│   │   ├── controllers/          # 控制器
│   │   ├── services/             # 业务服务
│   │   ├── models/               # 数据模型
│   │   ├── middleware/           # 中间件
│   │   └── utils/                # 工具
│   └── package.json
│
└── # 文档
└── docs/
    ├── architecture.md
    ├── api.md
    └── guide.md
```

### 4.3 核心模块依赖关系

```
┌─────────────────────────────────────────────────────────┐
│                      依赖关系                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                        ┌─────────┐                      │
│                        │  core   │                      │
│                        │  核心层  │                      │
│                        └────┬────┘                      │
│                             │                            │
│         ┌─────────┬─────────┼─────────┬─────────┐        │
│         │         │         │         │         │        │
│         ▼         ▼         ▼         ▼         ▼        │
│    ┌─────────┐┌─────────┐┌─────────┐┌─────────┐┌─────────┐ │
│    │ product ││  order  ││ member  ││  cart   ││payment │ │
│    │  商品   ││  订单   ││  会员   ││ 购物车  ││  支付   │ │
│    └────┬────┘└────┬────┘└────┬────┘└────┬────┘└────┬────┘ │
│         │         │         │         │         │        │
│         └─────────┼─────────┴─────────┼─────────┘        │
│                   │                   │                  │
│                   ▼                   ▼                  │
│            ┌───────────┐       ┌───────────┐             │
│            │ promotion │       │ hardware  │             │
│            │   促销    │       │   硬件    │             │
│            └───────────┘       └───────────┘             │
│                   │                                       │
├───────────────────┼───────────────────────────────────────┤
│                   ▼                                       │
│   ┌─────────────────────────────────────────────────┐    │
│   │                    应用层                         │    │
│   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │    │
│   │  │ miniapp │ │   web   │ │   pos   │ │  admin  │ │    │
│   │  │  小程序  │ │ Web/PWA │ │ 收银台   │ │ 管理后台 │ │    │
│   │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ │    │
│   └─────────────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 五、迁移策略

### 5.1 渐进式迁移

```
阶段1: 搭建基础架构（2-3周）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 搭建 monorepo 项目结构
- 实现 core 核心模块
- 实现 API 客户端封装
- 定义统一 TypeScript 类型

阶段2: 迁移小程序（2-3周）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 使用 Taro 重写小程序
- 复用 product/cart/order 模块
- 验证业务逻辑正确性

阶段3: 迁移收银台（3-4周）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 使用 Taro + RN 重写收银台
- 集成 hardware 硬件模块
- 对接硬件设备测试

阶段4: 迁移管理后台（2-3周）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 使用 Next.js 重写管理后台
- 复用 business modules
- 完善权限管理

阶段5: 完善与优化（持续）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 性能优化
- 用户体验优化
- 新功能开发
```

### 5.2 风险控制

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| 迁移周期长 | 业务停滞 | 分阶段交付，每阶段可独立运行 |
| 性能下降 | 用户体验差 | 做性能测试，对比优化 |
| 兼容性问题 | 部分功能不可用 | 保留老入口，做好兜底 |
| 团队学习成本 | 开发效率下降 | 提供培训文档和示例 |

---

## 六、关键实现

### 6.1 统一API客户端

```typescript
// packages/core/src/api/request.ts
import TaroRequest from '@tarojs/request';
import { API_BASE_URL, getToken } from './config';

class ApiClient {
  private baseURL: string;
  
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }
  
  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const token = getToken();
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    
    try {
      const response = await TaroRequest({
        url: `${this.baseURL}${endpoint}`,
        ...options,
        header: {
          ...defaultHeaders,
          ...options.header,
        },
      });
      
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  // 封装的快捷方法
  get<T>(endpoint: string, params?: object) {
    return this.request<T>(endpoint, { method: 'GET', data: params });
  }
  
  post<T>(endpoint: string, data?: object) {
    return this.request<T>(endpoint, { method: 'POST', data });
  }
  
  put<T>(endpoint: string, data?: object) {
    return this.request<T>(endpoint, { method: 'PUT', data });
  }
  
  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
```

### 6.2 购物车Hook（跨端复用）

```typescript
// packages/cart/src/hooks/useCart.ts
import { useCallback } from 'react';
import { useStore } from '@hailin/core';
import { cartService } from '../services';

export function useCart() {
  const { cart, setCart, addItem, removeItem, updateQuantity, clearCart } = useStore();
  
  // 添加商品到购物车
  const addToCart = useCallback(async (product: Product, quantity: number = 1) => {
    const result = await cartService.addToCart(product, quantity);
    if (result.success) {
      setCart(result.cart);
    }
    return result;
  }, [setCart]);
  
  // 更新商品数量
  const updateItemQuantity = useCallback(async (itemId: string, quantity: number) => {
    const result = await cartService.updateQuantity(itemId, quantity);
    if (result.success) {
      setCart(result.cart);
    }
    return result;
  }, [setCart]);
  
  // 移除商品
  const removeFromCart = useCallback(async (itemId: string) => {
    const result = await cartService.removeFromCart(itemId);
    if (result.success) {
      setCart(result.cart);
    }
    return result;
  }, [setCart]);
  
  // 清空购物车
  const clear = useCallback(async () => {
    const result = await cartService.clearCart();
    if (result.success) {
      setCart(result.cart);
    }
    return result;
  }, [setCart]);
  
  return {
    cart,
    itemCount: cart?.items?.length || 0,
    totalAmount: cart?.totalAmount || 0,
    addToCart,
    updateItemQuantity,
    removeFromCart,
    clearCart: clear,
  };
}
```

### 6.3 硬件服务（收银台专用）

```typescript
// packages/hardware/src/services/printer.ts
import { PrinterPlugin } from '../plugins/PrinterPlugin';

export class PrinterService {
  private plugin: PrinterPlugin;
  private status: PrinterStatus = 'disconnected';
  
  async connect(config: PrinterConfig): Promise<boolean> {
    try {
      this.plugin = new PrinterPlugin(config);
      await this.plugin.connect();
      this.status = 'connected';
      return true;
    } catch (error) {
      this.status = 'error';
      return false;
    }
  }
  
  async printReceipt(data: ReceiptData): Promise<boolean> {
    if (this.status !== 'connected') {
      throw new Error('Printer not connected');
    }
    
    try {
      await this.plugin.printReceipt(data);
      return true;
    } catch (error) {
      this.status = 'error';
      return false;
    }
  }
  
  getStatus(): PrinterStatus {
    return this.status;
  }
  
  async disconnect(): Promise<void> {
    if (this.plugin) {
      await this.plugin.disconnect();
      this.status = 'disconnected';
    }
  }
}
```

### 6.4 Taro 页面示例（收银台）

```tsx
// apps/pos/src/pages/cashier/index.tsx
import { View, Text, Button } from '@tarojs/components';
import { useCart } from '@hailin/cart';
import { useProduct } from '@hailin/product';
import { usePrinter } from '@hailin/hardware';
import { ProductGrid } from '@hailin/product/src/components/ProductGrid';
import { CartPanel } from '@hailin/cart/src/components/CartPanel';
import { PaymentDialog } from '@hailin/payment/src/components/PaymentDialog';

export default function CashierPage() {
  const { cart, totalAmount, itemCount } = useCart();
  const { products, categories, searchProducts } = useProduct();
  const { printer, printReceipt, isConnected: printerReady } = usePrinter();
  const [showPayment, setShowPayment] = useState(false);
  
  // 处理扫码
  const handleBarcodeScan = useCallback(async (barcode: string) => {
    const product = await searchProducts({ barcode });
    if (product) {
      await addToCart(product, 1);
    }
  }, [searchProducts]);
  
  // 完成支付
  const handlePaymentComplete = useCallback(async () => {
    if (printerReady) {
      await printReceipt({
        orderId: cart.orderId,
        items: cart.items,
        total: totalAmount,
        paymentMethod: 'wechat',
        timestamp: Date.now(),
      });
    }
    setShowPayment(false);
  }, [cart, totalAmount, printerReady]);
  
  return (
    <View className='cashier-page'>
      {/* 顶部工具栏 */}
      <View className='toolbar'>
        <Text>收银台 - {shopName}</Text>
        <Button onClick={handleBarcodeScan}>扫码</Button>
      </View>
      
      {/* 主体区域 */}
      <View className='main-area'>
        {/* 左侧：商品列表 */}
        <View className='product-section'>
          <ProductGrid
            products={products}
            onProductClick={handleProductClick}
          />
        </View>
        
        {/* 右侧：购物车 */}
        <View className='cart-section'>
          <CartPanel
            cart={cart}
            onQuantityChange={handleQuantityChange}
            onRemove={handleRemove}
          />
          
          <View className='checkout-area'>
            <Text>合计: ¥{totalAmount}</Text>
            <Button onClick={() => setShowPayment(true)}>
              结算 ({itemCount})
            </Button>
          </View>
        </View>
      </View>
      
      {/* 支付弹窗 */}
      {showPayment && (
        <PaymentDialog
          amount={totalAmount}
          onConfirm={handlePaymentComplete}
          onCancel={() => setShowPayment(false)}
        />
      )}
    </View>
  );
}
```

---

## 七、收益预估

### 7.1 成本对比

| 项目 | 当前架构 | 重构后 |
|------|---------|--------|
| 新功能开发 | 4端×2人天 | 1套×2人天 |
| Bug修复 | 4端×1人天 | 1套×0.5人天 |
| 界面改版 | 4端×3人天 | 1套×1人天 |
| 代码量 | 约40000行 | 约25000行 |
| 维护成本 | 高 | 降低60% |

### 7.2 长期收益

- **开发效率提升 50%+**
- **Bug率降低 40%+**
- **新功能上线周期缩短 30%**
- **团队学习成本降低**
- **更好的用户体验一致性**

---

## 八、下一步行动

### 8.1 立即可执行

1. [ ] 评审并确认本架构方案
2. [ ] 组建重构专项小组
3. [ ] 搭建开发环境
4. [ ] 开始阶段1：基础架构搭建

### 8.2 决策点

- 是否同意采用 **Taro** 作为跨端框架？
- 迁移优先级：收银台 > 小程序 > 管理后台？
- 团队是否有足够的 React/Vue 开发经验？

---

*文档版本: V1.0*
*最后更新: 2024-XX-XX*
*负责人: 技术团队*
