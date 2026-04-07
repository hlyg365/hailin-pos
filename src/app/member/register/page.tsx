'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, UserPlus, Store, Phone, User, Calendar, Loader2 } from 'lucide-react';

function MemberRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = searchParams.get('session');

  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    birthday: '',
    gender: 'male',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // 检查会话是否有效
  useEffect(() => {
    if (!session) {
      setError('无效的注册链接');
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 验证手机号
    if (!formData.phone) {
      setError('请输入手机号');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      setError('请输入正确的手机号');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/member/register-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session,
          phone: formData.phone,
          name: formData.name,
          birthday: formData.birthday,
          gender: formData.gender,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        // 3秒后自动关闭或跳转
        setTimeout(() => {
          // 尝试关闭窗口
          if (typeof window !== 'undefined' && (window as any).WeixinJSBridge) {
            // 微信环境
            (window as any).WeixinJSBridge.call('closeWindow');
          } else {
            // 其他浏览器，显示成功信息
          }
        }, 3000);
      } else {
        setError(data.error || '注册失败，请重试');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">注册成功</h2>
            <p className="text-gray-600 mb-4">欢迎成为海邻到家会员！</p>
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">手机号</span>
                <span className="font-medium">{formData.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">姓名</span>
                <span className="font-medium">{formData.name || '新会员'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">会员等级</span>
                <span className="font-medium text-purple-600">普通会员</span>
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-4">页面将自动关闭...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <UserPlus className="w-6 h-6 text-purple-500" />
            海邻到家会员注册
          </CardTitle>
          <CardDescription>
            注册成为会员，享受更多优惠
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                手机号 *
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="请输入手机号"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                maxLength={11}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                姓名
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="请输入姓名（选填）"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthday" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                生日
              </Label>
              <Input
                id="birthday"
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>性别</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    checked={formData.gender === 'male'}
                    onChange={() => setFormData({ ...formData, gender: 'male' })}
                    className="w-4 h-4"
                  />
                  <span>男</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    checked={formData.gender === 'female'}
                    onChange={() => setFormData({ ...formData, gender: 'female' })}
                    className="w-4 h-4"
                  />
                  <span>女</span>
                </label>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
              disabled={loading}
            >
              {loading ? '注册中...' : '立即注册'}
            </Button>

            <div className="text-center text-xs text-gray-400 mt-4">
              注册即表示同意《会员服务协议》
            </div>
          </form>

          {/* 会员权益说明 */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="font-medium text-gray-700 mb-3">会员权益</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>购物享95折</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>积分抵现金</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>生日双倍积分</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>专属会员活动</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading fallback component
function RegisterLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-white" />
    </div>
  );
}

// Main page component with Suspense boundary
export default function MemberRegisterPage() {
  return (
    <Suspense fallback={<RegisterLoading />}>
      <MemberRegisterForm />
    </Suspense>
  );
}
