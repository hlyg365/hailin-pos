# 接龙小程序使用指南

## 📱 功能概述

接龙小程序是专为社区便利店设计的社群团购接龙工具，支持快速创建接龙、管理接龙、参与接龙、数据统计等功能。

---

## 🎯 核心功能

### 1. 接龙列表
- **功能描述**: 查看所有接龙活动
- **页面路径**: `pages/chain/index`
- **主要功能**:
  - 搜索接龙
  - 按状态筛选（全部/进行中/已结束）
  - 查看接龙基本信息
  - 快速参与接龙

### 2. 接龙详情
- **功能描述**: 查看接龙详细信息和参与者列表
- **页面路径**: `pages/chain/detail`
- **主要功能**:
  - 查看接龙信息（标题、描述、价格、截止时间）
  - 查看商品清单
  - 查看参与者列表
  - 参与接龙
  - 分享接龙

### 3. 创建接龙
- **功能描述**: 发起新的接龙活动
- **页面路径**: `pages/chain/create`
- **主要功能**:
  - 设置接龙标题
  - 添加接龙描述
  - 设置价格
  - 设置截止时间
  - 添加商品清单
  - 选择商品数量

### 4. 我的接龙
- **功能描述**: 管理自己创建的接龙
- **页面路径**: `pages/chain/my`
- **主要功能**:
  - 查看接龙统计（进行中/已结束/总数）
  - 按状态筛选接龙
  - 快速操作（分享、管理、结束）
  - 创建新接龙

### 5. 接龙管理
- **功能描述**: 详细管理接龙各项设置
- **页面路径**: `pages/chain/manage`
- **主要功能**:
  - 快捷操作（数据统计、分享、通知、编辑）
  - 接龙设置（标题、时间、人数限制、价格）
  - 商品管理（添加、编辑、删除）
  - 高级设置（自动结束、实时通知、允许修改）
  - 危险操作（暂停、结束、删除）

### 6. 接龙数据
- **功能描述**: 查看接龙详细数据和统计
- **页面路径**: `pages/chain/data`
- **主要功能**:
  - 查看接龙统计数据
  - 查看参与者列表
  - 查看商品统计
  - 查看接龙记录时间线
  - 导出数据
  - 打印数据

---

## 🚀 快速开始

### 安装依赖

```bash
cd hailin-ministore
pnpm install
```

### 运行小程序

```bash
# 使用HBuilderX
1. 打开HBuilderX
2. 导入 hailin-ministore 项目
3. 运行 > 运行到小程序模拟器 > 微信开发者工具

# 或使用命令行
pnpm dev:mp-weixin
```

### 配置小程序

1. 在微信开发者工具中配置小程序AppID
2. 配置服务器域名（如果需要）
3. 测试各项功能

---

## 📖 使用示例

### 创建接龙

```javascript
// pages/chain/create.vue
const formData = ref({
  title: '新鲜水果团购接龙',
  description: '新鲜水果，产地直发',
  price: '39.90',
  endTime: '2024-04-10 18:00',
  products: [
    { name: '苹果', price: '12.90', quantity: 1 },
    { name: '香蕉', price: '8.90', quantity: 1 }
  ]
})

// 调用API创建接龙
import { createChain } from '@/api/chain.js'

const submit = async () => {
  try {
    const res = await createChain(formData.value)
    uni.showToast({ title: '创建成功', icon: 'success' })
    uni.navigateBack()
  } catch (err) {
    uni.showToast({ title: '创建失败', icon: 'none' })
  }
}
```

### 参与接龙

```javascript
// pages/chain/detail.vue
const joinChain = async () => {
  try {
    const res = await joinChain(chainId.value, {
      name: '张三',
      phone: '13800138000',
      quantity: 1
    })
    uni.showToast({ title: '参与成功', icon: 'success' })
    loadChainDetail()
  } catch (err) {
    uni.showToast({ title: '参与失败', icon: 'none' })
  }
}
```

### 获取接龙列表

```javascript
import { getChainList } from '@/api/chain.js'

const loadChains = async () => {
  try {
    const res = await getChainList({ status: 'active' })
    chainList.value = res.data
  } catch (err) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}
```

### 导出接龙数据

```javascript
import { exportChainData } from '@/api/chain.js'

const exportData = async () => {
  try {
    const res = await exportChainData(chainId.value)
    // 下载文件
    uni.downloadFile({
      url: res.url,
      success: (downloadRes) => {
        uni.openDocument({
          filePath: downloadRes.tempFilePath,
          success: () => {
            uni.showToast({ title: '导出成功', icon: 'success' })
          }
        })
      }
    })
  } catch (err) {
    uni.showToast({ title: '导出失败', icon: 'none' })
  }
}
```

---

## 🔧 API接口说明

### 接龙相关API

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/chain | GET | 获取接龙列表 |
| /api/chain/:id | GET | 获取接龙详情 |
| /api/chain | POST | 创建接龙 |
| /api/chain/:id | PUT | 更新接龙 |
| /api/chain/:id | DELETE | 删除接龙 |
| /api/chain/:id/join | POST | 参与接龙 |
| /api/chain/:id/participants | GET | 获取参与者列表 |
| /api/chain/:id/stats | GET | 获取统计数据 |
| /api/chain/my | GET | 获取我的接龙 |
| /api/chain/:id/end | POST | 结束接龙 |
| /api/chain/:id/pause | POST | 暂停接龙 |
| /api/chain/:id/resume | POST | 恢复接龙 |
| /api/chain/:id/export | GET | 导出数据 |
| /api/chain/:id/notify | POST | 通知参与者 |
| /api/chain/:id/copy | POST | 复制接龙 |
| /api/chain/:id/settings | PUT | 更新设置 |

---

## 📊 数据结构

### 接龙对象

```javascript
{
  id: '1',                    // 接龙ID
  title: '接龙标题',           // 接龙标题
  description: '接龙描述',     // 接龙描述
  price: '39.90',             // 价格
  participantCount: 15,       // 参与人数
  totalAmount: '598.50',      // 总金额
  totalQuantity: 15,          // 总份数
  status: 'active',           // 状态: active/ended/paused/cancelled
  type: 'public',             // 类型: public/private
  endTime: '2024-04-10 18:00',// 截止时间
  creator: '店长',            // 创建者
  products: [                 // 商品列表
    {
      id: '1',
      name: '苹果',
      image: '图片URL',
      price: '12.90',
      quantity: 1
    }
  ],
  settings: {                 // 设置
    autoEnd: true,            // 自动结束
    realtimeNotify: true,     // 实时通知
    allowModify: false,       // 允许修改
    showParticipants: true,   // 显示参与者
    maxParticipants: null     // 最大参与人数
  }
}
```

### 参与者对象

```javascript
{
  id: '1',                    // 参与者ID
  name: '张三',               // 姓名
  avatar: '头像URL',          // 头像
  phone: '138****1234',       // 手机号
  quantity: 1,                // 数量
  amount: '39.90',            // 金额
  joinTime: '04-07 14:30'     // 参与时间
}
```

---

## 🎨 页面样式

### 主题色

```scss
$primary-color: #FF6B35;     // 主色（橙色）
$success-color: #4CAF50;     // 成功（绿色）
$warning-color: #FF9800;     // 警告（橙色）
$error-color: #FF3B30;       // 错误（红色）
$text-primary: #333333;      // 主文本
$text-secondary: #666666;    // 次要文本
$text-placeholder: #999999;  // 占位文本
```

### 圆角

```scss
$border-radius-sm: 8rpx;     // 小圆角
$border-radius-md: 12rpx;    // 中圆角
$border-radius-lg: 16rpx;    // 大圆角
$border-radius-xl: 24rpx;    // 超大圆角
```

### 间距

```scss
$spacing-xs: 8rpx;           // 极小间距
$spacing-sm: 12rpx;          // 小间距
$spacing-md: 16rpx;          // 中间距
$spacing-lg: 20rpx;          // 大间距
$spacing-xl: 30rpx;          // 超大间距
```

---

## 🔍 常见问题

### Q1: 如何复制接龙？

A: 在"我的接龙"页面，点击"复制接龙"按钮，系统会创建一个相同的新接龙，您可以修改后发布。

### Q2: 如何导出接龙数据？

A: 在接龙详情或接龙数据页面，点击"导出数据"按钮，数据会以Excel格式导出。

### Q3: 如何通知参与者？

A: 在接龙管理页面，点击"通知用户"按钮，可以发送消息通知所有参与者。

### Q4: 接龙可以修改吗？

A: 创建者可以在接龙管理页面修改接龙信息，如需要开启"允许修改"设置，参与者也可以修改自己的接龙信息。

### Q5: 如何结束接龙？

A: 创建者可以在接龙管理页面点击"结束接龙"按钮，或设置"自动结束"，到达截止时间自动结束。

---

## 📞 技术支持

如有问题，请联系技术团队。

---

## 📝 更新日志

### v1.0.0 (2024-04-07)
- ✅ 接龙列表功能
- ✅ 接龙详情功能
- ✅ 创建接龙功能
- ✅ 我的接龙功能
- ✅ 接龙管理功能
- ✅ 接龙数据功能

---

**文档版本：v1.0**
**更新时间：2024-04-07**
**维护者：海邻到家技术团队**
