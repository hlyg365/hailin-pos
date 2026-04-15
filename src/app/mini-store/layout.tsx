'use client';

// 小程序商城根布局 - 独立的全屏移动端布局
export default function MiniStoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
