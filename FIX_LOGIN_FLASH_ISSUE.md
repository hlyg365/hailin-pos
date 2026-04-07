# 登录闪退问题修复

## 问题描述

总部管理后台测试账号登录后出现闪退，无法正常进入系统。

## 问题分析

登录页面实际路径是 `/auth/login`，但认证检查逻辑中使用了错误的路径 `/login`，导致：

1. **Layout 路径检查错误**：检查 `/login` 而非 `/auth/login`
2. **重定向路径错误**：未登录时跳转到 `/login` 而非 `/auth/login`
3. **登录页面被视为需认证页面**：显示"正在跳转..."后又被重定向

## 修复内容

### 1. 修复 Layout 路径检查

**文件**：`src/app/(dashboard)/layout.tsx`

**修改**：
- 第19行：`pathname === '/login'` → `pathname.startsWith('/auth/login')`
- 第42行：`router.replace('/login')` → `router.replace('/auth/login')`

### 2. 修复认证上下文路径

**文件**：`src/contexts/HqAuthContext.tsx`

**修改**：
- 第106行：检查路径从 `/login` → `/auth/login`
- 第117行：重定向从 `/login` → `/auth/login`
- 第127行：错误处理重定向从 `/login` → `/auth/login`
- 第143行：登出重定向从 `/login` → `/auth/login`

### 3. 优化重定向逻辑

**改进**：在 Layout 中添加 `useEffect` 来处理未登录重定向，避免渲染时立即重定向导致的问题。

## 登录测试

### 测试账号

| 账号 | 密码 | 角色 | 部门 |
|------|------|------|------|
| superadmin | admin888 | 超级管理员 | 总部 |
| manager | manager123 | 运营经理 | 运营部 |
| finance | finance123 | 财务主管 | 财务部 |
| supply | supply123 | 供应链专员 | 供应链部 |

### 测试步骤

1. 访问 `/auth/login` 进入登录页面
2. 输入测试账号密码
3. 点击登录按钮
4. 验证成功跳转到首页 `/`
5. 验证侧边栏和顶部显示正确
6. 验证退出登录功能正常

### 预期结果

- ✅ 登录页面正常显示
- ✅ 输入账号密码后成功登录
- ✅ 跳转到首页并显示数据看板
- ✅ 左侧显示导航菜单
- ✅ 右上角显示当前用户信息
- ✅ 点击退出登录后正确跳转到登录页

## 技术细节

### 认证流程

```
1. 用户访问 /auth/login
   ↓
2. Layout 检查 pathname.startsWith('/auth/login')
   ↓
3. 返回 true，跳过认证检查
   ↓
4. 显示登录页面
   ↓
5. 用户输入账号密码，点击登录
   ↓
6. 验证账号密码
   ↓
7. 设置 localStorage (hq_logged_in, hq_user)
   ↓
8. router.push('/') 跳转到首页
   ↓
9. Layout 重新渲染
   ↓
10. HqAuthContext 检查 localStorage
   ↓
11. 找到登录状态，设置 user 和 loading = false
   ↓
12. 显示首页内容
```

### 关键代码

**Layout 路径检查**：
```typescript
// 登录页面不需要认证保护
if (pathname.startsWith('/auth/login')) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
```

**HqAuthContext 初始化**：
```typescript
useEffect(() => {
  // 登录页面跳过检查
  if (pathname.startsWith('/auth/login')) {
    setLoading(false);
    return;
  }
  
  // 检查 localStorage 中的登录状态
  const isLoggedIn = localStorage.getItem('hq_logged_in');
  const userData = localStorage.getItem('hq_user');
  
  if (!isLoggedIn || !userData) {
    router.replace('/auth/login');
    return;
  }
  
  // 设置用户状态
  setUser(JSON.parse(userData));
  setLoading(false);
}, [pathname, router]);
```

## 相关文件

- `src/app/(dashboard)/layout.tsx` - 仪表盘布局
- `src/contexts/HqAuthContext.tsx` - 总部认证上下文
- `src/app/(dashboard)/auth/login/page.tsx` - 登录页面
- `src/components/app-sidebar.tsx` - 侧边栏组件

## 注意事项

1. **路由组不影响 URL**：`(dashboard)` 路由组只是组织代码用，不影响实际 URL
2. **localStorage 持久化**：登录状态存储在 localStorage，刷新页面不会丢失登录状态
3. **权限控制**：不同角色的权限不同，会影响页面显示的功能模块
4. **测试环境**：目前使用模拟账号密码，生产环境应替换为真实的后端验证

---

**修复日期**：2024-04-07  
**修复人**：AI Assistant  
**验证状态**：待测试
