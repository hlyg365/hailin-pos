# 海邻到家社区便利店智能收银系统 V3.0

## 项目概览

海邻到家是一个面向社区便利店的智能收银与营销管理系统，采用收银台独立APP + 后台管理系统 + 店长助手移动端三端分离架构，支持离线运行、PWA安装、硬件设备集成，完全适配《社区便利店精细化运营方案》V3.0全链路要求。

### 核心特性

- **收银台独立APP**：支持离线收银、PWA安装、扫码枪/打印机/钱箱集成
- **店长助手移动端**：移动收银、库存盘点、数据报表、采购申请、促销申请
- **店铺数据隔离**：每家店铺独立管理，会员数据共享
- **会员统一体系**：四级会员等级、积分规则、会员权益
- **优惠券系统**：满减券、折扣券、代金券，支持小程序和线下门店双渠道核销
- **商品图片管理**：主图和详情图分离，支持收银台、小程序、团购多渠道共享
- **促销双轨制**：总部统一促销 + 店铺自主促销
- **便民服务**：话费充值、水电缴费、快递代收
- **供应链协同**：要货申请、集中采购、配送签收
- **总部管控**：多门店管理、分级权限、数据看板
- **财务分账**：自动分账、跨店结算、财务报表
- **合规风控**：临期预警、巡店管理、合规台账
- **加盟管理**：四级权限模板、加盟生命周期

### 技术栈

- **框架**: Next.js 16 (App Router)
- **UI库**: React 19, TypeScript 5
- **组件**: shadcn/ui (基于 Radix UI)
- **样式**: Tailwind CSS 4
- **状态管理**: React Context + useState
- **离线存储**: IndexedDB
- **硬件集成**: Web Serial API, Web Bluetooth API
- **包管理**: pnpm

## 目录结构

```
.
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # 后台管理系统（路由组）
│   │   │   ├── page.tsx        # 总部数据看板
│   │   │   ├── inventory/      # 库存管理
│   │   │   │   ├── store-requests/  # 要货申请
│   │   │   │   ├── purchase/   # 采购管理
│   │   │   │   ├── suppliers/  # 供应商管理
│   │   │   │   └── transfer/   # 调拨管理
│   │   │   ├── stores/         # 门店管理
│   │   │   ├── members/        # 会员管理
│   │   │   ├── reports/        # 报表分析
│   │   │   └── ...             # 其他模块
│   │   ├── pos/                # 收银台APP
│   │   │   ├── page.tsx        # 收银台主页
│   │   │   ├── login/          # 登录页
│   │   │   ├── inventory/      # 库存管理
│   │   │   ├── products/       # 商品管理
│   │   │   ├── members/        # 会员管理
│   │   │   ├── services/       # 便民服务
│   │   │   ├── hardware/       # 硬件管理
│   │   │   └── settings/       # APP设置
│   │   ├── assistant/          # 店长助手移动端
│   │   │   ├── layout.tsx      # 移动端布局
│   │   │   ├── page.tsx        # 首页Dashboard
│   │   │   ├── login/          # 登录页
│   │   │   ├── inventory/      # 库存管理
│   │   │   │   ├── page.tsx    # 库存列表
│   │   │   │   ├── stocktake/  # 库存盘点
│   │   │   │   └── scan/       # 扫码查询
│   │   │   ├── cashier/        # 移动收银
│   │   │   ├── reports/        # 数据报表
│   │   │   ├── purchase/       # 采购申请
│   │   │   ├── promotion/      # 促销申请
│   │   │   └── profile/        # 个人中心
│   │   ├── store-admin/        # 店长管理助手
│   │   │   ├── layout.tsx      # PC端布局（侧边栏+顶部栏）
│   │   │   ├── page.tsx        # 数据看板
│   │   │   ├── login/          # 登录页
│   │   │   ├── app-download/   # APP下载页面（二维码）
│   │   │   ├── settings/       # 店铺设置
│   │   │   ├── orders/         # 订单管理
│   │   │   ├── inventory/      # 库存管理
│   │   │   ├── members/        # 会员管理
│   │   │   ├── reports/        # 销售报表
│   │   │   ├── promotions/     # 促销管理
│   │   │   └── purchase/       # 采购申请
│   │   ├── api/                # API路由
│   │   └── layout.tsx          # 根布局
│   ├── components/             # React组件
│   │   ├── ui/                 # shadcn/ui组件
│   │   ├── pos-sidebar.tsx     # 收银台侧边栏
│   │   └── offline/            # 离线相关组件
│   ├── contexts/               # React Context
│   │   ├── PosAuthContext.tsx  # 收银台认证
│   │   └── StoreContext.tsx    # 店铺上下文
│   ├── hooks/                  # 自定义Hooks
│   │   ├── useOffline.ts       # 离线状态管理
│   │   └── useHardware.ts      # 硬件设备管理
│   └── lib/                    # 工具库
│       ├── offline-db.ts       # IndexedDB封装
│       ├── hardware-service.ts # 硬件服务
│       ├── member-service.ts   # 会员服务
│       ├── supply-chain-service.ts  # 供应链服务
│       ├── compliance-service.ts    # 合规风控服务
│       ├── finance-service.ts       # 财务分账服务
│       ├── store-control-service.ts # 门店管控服务
│       ├── product-lifecycle-service.ts # 商品生命周期服务
│       └── app-config.ts       # APP配置
├── public/
│   ├── manifest.json           # PWA配置
│   ├── sw.js                   # Service Worker
│   └── icons/                  # PWA图标
└── docs/                       # 文档
```

## 构建和测试命令

```bash
# 安装依赖
pnpm install

# 开发环境（端口5000）
pnpm dev

# 类型检查
npx tsc --noEmit

# 构建生产版本
pnpm build

# 启动生产环境
pnpm start

# 代码检查
pnpm lint
```

## 核心功能模块

### 1. 收银台核心功能

**文件**: `src/app/pos/page.tsx`

- 商品展示与分类筛选
- 购物车管理
- 扫码枪集成（USB扫码枪自动识别）
- 会员识别与折扣
- 支付结算与打印小票
- 钱箱控制
- 挂单/取单功能
- 离线模式支持

**硬件集成**:
```typescript
// 使用硬件Hook
const { enableScanner, printReceipt, openCashbox } = useHardware();

// 启用USB扫码枪
enableScanner('usb', (barcode) => {
  // 扫码回调处理
});

// 打印小票
await printReceipt(receiptData);

// 打开钱箱
await openCashbox();
```

### 2. 供应链协同系统

**文件**: `src/lib/supply-chain-service.ts`

**核心功能**:
- 要货申请：店铺提交要货单，总部审批
- 集中采购：采购计划、供应商管理、订单跟踪
- 配送签收：配送单管理、签收确认

**使用示例**:
```typescript
// 创建要货申请
const request = createSupplyRequest(storeId, items, '要货说明');

// 审批要货申请
approveSupplyRequest(requestId, 'approved', '审批意见');

// 创建采购订单
const order = createPurchaseOrder(supplierId, items);

// 创建配送单
const delivery = createDelivery(purchaseOrderId, targetStores);
```

### 3. 总部管控系统

**文件**: `src/lib/store-control-service.ts`

**门店分级**:
- **直营店**：全权限，所有模块可用
- **A级加盟店**：核心功能 + 高级报表
- **B级加盟店**：核心功能 + 基础报表
- **C级加盟店**：仅基础功能

**权限模板**:
```typescript
// 应用权限模板到门店
applyPermissionTemplate(storeId, 'A');

// 获取门店权限
const permissions = getStorePermissions(storeId);

// 检查权限
if (hasPermission(storeId, 'finance:view')) {
  // 允许查看财务报表
}
```

### 4. 财务分账系统

**文件**: `src/lib/finance-service.ts`

**分账规则**:
- 直营店：全额归集到总部
- 加盟店：自动扣除费用后结算

**使用示例**:
```typescript
// 创建收支记录
const income = createIncomeRecord(storeId, {
  type: 'sales',
  amount: 10000,
  category: '营业款',
});

// 执行自动分账
const settlement = executeAutoSettlement(storeId, period);

// 生成分账报表
const report = generateSettlementReport(period);
```

### 5. 优惠券系统

**文件**: `src/lib/coupon-service.ts`

**优惠券类型**:
- **满减券**：订单满指定金额减指定金额
- **折扣券**：订单享受指定折扣
- **代金券**：固定金额抵扣

**核销渠道**:
- 小程序商城：`mini_program`
- 线下门店：`offline_store`

**使用示例**:
```typescript
// 创建优惠券模板
const template = createCouponTemplate({
  name: '满50减10优惠券',
  couponType: 'fullreduce',
  discountAmount: 10,
  minAmount: 50,
  validDays: 30,
  totalQuantity: 100,
  useChannels: ['miniapp', 'offline'],
});

// 发放优惠券给用户
const userCoupon = issueCouponToUser(
  templateId,
  memberId,
  memberName,
  memberPhone,
  'manual'
);

// 核销优惠券
const result = verifyCoupon(
  verificationCode, // 或 couponCode
  'offline_store',
  orderId,
  orderAmount,
  storeId,
  storeName,
  operatorId,
  operatorName
);
```

**API接口**:
- `GET /api/coupon/templates` - 获取优惠券模板列表
- `POST /api/coupon/templates` - 创建优惠券模板
- `PUT /api/coupon/templates` - 更新优惠券模板
- `GET /api/coupon/user?memberId=xxx` - 获取用户优惠券
- `GET /api/coupon/user?all=true` - 获取所有用户优惠券
- `POST /api/coupon/user` - 发放优惠券给用户
- `POST /api/coupon/verify` - 核销优惠券

### 6. 合规风控系统

**文件**: `src/lib/compliance-service.ts`

**核心功能**:
- 临期预警：自动检测临期商品
- 合规台账：食品安全、烟草专卖监管
- 巡店管理：巡店计划、问题跟踪

**使用示例**:
```typescript
// 创建巡店计划
const plan = createInspectionPlan({
  storeId: 'store-001',
  scheduledDate: '2024-01-15',
  inspector: '张巡店',
});

// 提交巡店报告
submitInspectionReport(planId, {
  overallScore: 92,
  issues: [...],
});

// 检查合规状态
checkComplianceStatus(storeId);
```

### 7. 商品生命周期管理

**文件**: `src/lib/product-lifecycle-service.ts`

**核心功能**:
- 临期商品预警
- 损耗登记与分析
- 先进先出库存管理

**使用示例**:
```typescript
// 获取临期预警
const warnings = getExpiryWarnings(storeId, 30);

// 登记损耗
registerLoss(storeId, productId, quantity, reason);

// 获取先进先出库存
const fifoStock = getFIFOStock(storeId, productId);
```

### 8. 离线运行

**文件**: `src/lib/offline-db.ts`, `src/hooks/useOffline.ts`

- IndexedDB存储商品、订单、会员数据
- 离线状态检测
- 网络恢复自动同步
- 待同步订单管理

### 9. 会员体系

**文件**: `src/lib/member-service.ts`

**会员等级**:
- 普通会员：无折扣，1倍积分
- 银卡会员：98折，1.2倍积分
- 金卡会员：95折，1.5倍积分
- 钻石会员：90折，2倍积分

**积分规则**:
```typescript
// 计算订单积分
const points = calculateOrderPoints(amount, memberLevel, isBirthday);

// 计算会员折扣
const { discount, finalAmount } = calculateMemberDiscount(amount, memberLevel);
```

### 10. 便民服务

**文件**: `src/app/pos/services/page.tsx`

- 话费充值（移动/联通/电信）
- 电费缴纳
- 水费缴纳
- 快递代收

### 11. 晚8点清货

**触发条件**: 每日20:00后自动开启

**功能**:
- 状态栏显示清货模式标识
- 小票标注【晚8点清货特价】
- 自动应用清货折扣

### 12. 商品图片管理系统

**文件**: `src/lib/product-image-service.ts`, `src/components/product-image-manager.tsx`

**核心功能**:
- 主图管理：收银台、小程序、团购共用
- 详情图管理：小程序商品详情页专用
- 多渠道共享：图片可选择使用渠道
- 双上传方式：本地上传 + 扫码上传

**使用渠道**:
- `pos`：收银台
- `miniapp`：小程序商城
- `groupbuy`：团购
- `all`：全渠道共享

**上传方式**:
- **本地上传**：点击或拖拽选择本地图片文件上传
- **扫码上传**：生成二维码，使用手机扫码上传图片

**使用示例**:
```typescript
// 上传商品主图
const mainImage = ProductImageService.addProductImage(
  productId,
  'main',
  imageKey,
  imageUrl,
  ['all'],  // 全渠道共享
  'admin'
);

// 上传详情图
const detailImage = ProductImageService.addProductImage(
  productId,
  'detail',
  imageKey,
  imageUrl,
  ['miniapp'],  // 仅小程序使用
  'admin'
);

// 获取商品主图（收银台用）
const mainImageUrl = ProductImageService.getMainImageUrl(productId);

// 获取商品详情图（小程序用）
const detailUrls = ProductImageService.getDetailImageUrls(productId);

// 根据渠道获取图片
const posImages = ProductImageService.getImagesByChannel(productId, 'pos');
```

**API接口**:
- `GET /api/products/images?productId=xxx` - 获取商品图片配置
- `GET /api/products/images?productId=xxx&channel=miniapp` - 根据渠道获取图片
- `POST /api/products/images` - 上传商品图片（支持FormData和JSON两种方式）
- `PUT /api/products/images` - 更新图片信息（渠道、排序）
- `DELETE /api/products/images?imageId=xxx` - 删除图片

**管理入口**:
- 总部商品管理：商品编辑弹窗中集成图片管理组件
- 小程序商城：`/marketing/mini-store/product-images` 汇总查看所有商品图片状态

**组件使用**:
```tsx
// 完整模式
<ProductImageManager
  productId="prod-1"
  productName="商品名称"
  onImagesChange={(mainImage, detailImages) => {
    // 图片变更回调
  }}
/>

// 紧凑模式（用于商品编辑弹窗）
<ProductImageManager
  productId="prod-1"
  compact
/>
```

## 代码风格指南

### TypeScript

- 严格模式开启
- 接口和类型定义放在文件顶部或单独的types文件
- 避免使用 `any`，使用 `unknown` 或具体类型

### React

- 函数组件 + Hooks
- 状态管理优先使用 `useState`，复杂状态考虑 `useReducer`
- 副作用使用 `useEffect`，注意清理函数
- 自定义Hook以 `use` 开头

### 样式

- 使用 Tailwind CSS 工具类
- 组件样式使用 `cn()` 函数合并类名
- 响应式设计使用 Tailwind 断点

### 命名规范

- 文件：kebab-case（如 `offline-indicator.tsx`）
- 组件：PascalCase（如 `OfflineIndicator`）
- 函数/变量：camelCase
- 常量：UPPER_SNAKE_CASE
- 接口：PascalCase，不加 `I` 前缀

## 安全注意事项

1. **认证信息**: 使用 `PosAuthContext` 管理，存储在 localStorage
2. **敏感数据**: 不在前端存储密码等敏感信息
3. **API调用**: 所有API路由添加 `export const dynamic = 'force-dynamic'`
4. **XSS防护**: React自动转义，避免使用 `dangerouslySetInnerHTML`
5. **HTTPS**: 生产环境必须使用HTTPS

## 离线功能说明

### 数据存储

```typescript
// 保存商品
await ProductsStore.saveAll(products);

// 获取所有商品
const products = await ProductsStore.getAll();

// 根据条码搜索
const product = await ProductsStore.findByBarcode(barcode);

// 创建订单
await OrdersStore.save(order);

// 获取待同步订单
const pendingOrders = await OrdersStore.getPendingOrders();
```

### 离线检测

```typescript
const { isOnline, isOffline, offlineDuration } = useOfflineStatus();

if (isOffline) {
  // 离线模式处理
}
```

## 硬件设备支持

### 扫码枪

- USB扫码枪：自动识别，作为键盘输入设备
- 蓝牙扫码枪：需要连接配对
- 摄像头扫码：需要相机权限

### 打印机

- 蓝牙打印机：通过Web Bluetooth API连接
- USB打印机：通过Web Serial API连接
- 网络打印机：通过后端代理连接

### 钱箱

- 通过打印机接口控制
- 支持手动触发打开

## 测试说明

### 单元测试

目前未集成测试框架，建议添加：

```bash
pnpm add -D vitest @testing-library/react
```

### 接口测试

使用 `curl` 或 Postman 测试API接口：

```bash
# 健康检查
curl http://localhost:5000/api/health

# 商品识别
curl -X POST http://localhost:5000/api/products/recognize-image \
  -H "Content-Type: application/json" \
  -d '{"image":"base64_image_data"}'
```

### 手动测试清单

- [ ] 收银台登录/登出
- [ ] 商品添加到购物车
- [ ] 会员识别与折扣计算
- [ ] 支付流程（现金/微信/支付宝）
- [ ] 小票打印
- [ ] 钱箱打开
- [ ] 离线模式切换
- [ ] 挂单/取单
- [ ] 便民服务各项功能
- [ ] 晚8点清货模式触发

## 部署说明

### 开发环境

```bash
# 启动开发服务器
coze dev
# 或
pnpm dev
```

### 生产环境

```bash
# 构建
pnpm build

# 启动
pnpm start
```

### 环境变量

- `COZE_WORKSPACE_PATH`: 项目工作目录
- `COZE_PROJECT_DOMAIN_DEFAULT`: 对外访问域名
- `DEPLOY_RUN_PORT`: 服务监听端口（默认5000）
- `COZE_PROJECT_ENV`: 环境标识（DEV/PROD）

## 常见问题

### Q: 双侧边栏问题？

A: 确保使用路由组 `(dashboard)` 包含后台管理页面，收银台 `/pos/*` 使用独立布局。

### Q: 离线数据不同步？

A: 检查网络状态，手动点击"同步订单"按钮，或等待自动同步。

### Q: 打印机无法连接？

A: 确保使用HTTPS或localhost，浏览器支持Web Serial/Bluetooth API。

### Q: 扫码枪不工作？

A: USB扫码枪应自动识别，检查是否作为键盘设备连接。

## 更新日志

### 2024-03-18 V3.0

#### 新增功能
- ✅ 供应链协同系统（要货申请、集中采购、配送签收）
- ✅ 总部管控系统（多门店管理、分级权限、数据看板）
- ✅ 财务分账系统（自动分账、收支管理、财务报表）
- ✅ 合规风控系统（合规台账、风险预警、巡店管理）
- ✅ 商品生命周期管理（临期预警、损耗登记、先进先出）
- ✅ 完善收银台硬件集成（扫码枪、小票打印、钱箱控制）
- ✅ 实现晚8点清货功能
- ✅ 新增便民服务模块（话费充值、水电缴费、快递代收）
- ✅ 完善会员体系（积分规则、等级权益、会员折扣）

#### 文件变更
- `src/lib/supply-chain-service.ts` - 新增供应链服务
- `src/lib/compliance-service.ts` - 新增合规风控服务
- `src/lib/finance-service.ts` - 新增财务分账服务
- `src/lib/store-control-service.ts` - 新增门店管控服务
- `src/lib/product-lifecycle-service.ts` - 新增商品生命周期服务
- `src/lib/hardware-service.ts` - 完善硬件服务
- `src/hooks/useHardware.ts` - 新增硬件管理Hook
- `src/lib/member-service.ts` - 新增会员服务
- `src/app/pos/services/page.tsx` - 新增便民服务页面
- `src/app/pos/page.tsx` - 集成硬件和会员功能
- `src/app/(dashboard)/inventory/store-requests/page.tsx` - 新增要货申请页面
- `src/app/(dashboard)/stores/page.tsx` - 完善门店管理页面
- `src/app/(dashboard)/stores/finance/page.tsx` - 新增财务分账页面
- `src/app/(dashboard)/stores/compliance/page.tsx` - 新增合规风控页面
- `src/app/(dashboard)/stores/franchise/page.tsx` - 新增加盟管理页面

## 后续优化建议

### 高优先级
1. 生鲜专项管控：损耗管控、分拣管理
2. 数据看板完善：实时销售、库存预警
3. 营销活动管理：优惠券系统、促销活动配置

### 中优先级
4. 移动端适配优化
5. 性能优化（大屏显示、快速扫码）
6. 多语言支持

### 低优先级
7. 高级报表：会员分析、商品分析
8. AI智能推荐：智能补货、销售预测

## 联系方式

如有问题，请联系开发团队或查看项目文档。

---

# V2.0 架构重构方案（规划中）

## 当前架构问题

| 问题 | 表现 | 影响 |
|------|------|------|
| 代码重复 | 收银台、小程序、管理后台各自独立代码 | 维护成本高 |
| 升级困难 | 各端独立升级，风险高 | 线上问题修复慢 |
| 硬件集成复杂 | APP和H5行为不一致 | 用户体验差 |

## 新架构设计

### 技术选型

- **跨端框架**: Taro 4.0（React语法）
- **编译目标**: 微信小程序 + H5 + React Native APP
- **状态管理**: 统一状态层（@hailin/cart等packages）
- **API层**: 统一API客户端（@hailin/core）

### 项目结构（monorepo）

```
hailin-unified/
├── packages/           # 核心业务包（各端共享）
│   ├── core/          # API客户端、类型定义
│   ├── product/       # 商品模块
│   ├── cart/          # 购物车模块
│   ├── order/         # 订单模块
│   ├── member/        # 会员模块
│   ├── payment/       # 支付模块
│   ├── promotion/     # 促销模块
│   └── hardware/      # 硬件模块（收银台专用）
├── apps/              # 各端应用入口
│   ├── miniapp/       # 微信小程序
│   ├── pos/           # 收银台APP
│   ├── web/           # Web/PWA
│   └── admin/         # 管理后台
└── server/            # 后端服务
```

### 模块使用示例

```tsx
// 购物车 - 跨端复用
import { useCart } from '@hailin/cart';

// 硬件 - 收银台专用
import { usePrinter, useScanner } from '@hailin/hardware';
```

### 迁移策略

1. **阶段1**: 搭建基础架构（packages/core, packages/cart）
2. **阶段2**: 迁移小程序（Taro重写）
3. **阶段3**: 迁移收银台（Taro + RN）
4. **阶段4**: 迁移管理后台（Next.js）

详细方案见：`docs/ARCHITECTURE_V2.md`
