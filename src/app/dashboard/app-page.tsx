import { redirect } from 'next/navigation';

export default function AppRootPage() {
  // 重定向到收银台登录页
  redirect('/pos/auth/login');
}
