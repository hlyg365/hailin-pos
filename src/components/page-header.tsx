'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  showStoreSelector?: boolean;
}

interface Store {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'closed';
}

export function PageHeader({
  title,
  description,
  children,
  showStoreSelector = true,
}: PageHeaderProps) {
  const [stores] = useState<Store[]>([
    { id: '1', name: '南山科技园店', status: 'active' },
    { id: '2', name: '福田中心店', status: 'active' },
    { id: '3', name: '罗湖东门店', status: 'active' },
    { id: '4', name: '宝安西乡店', status: 'active' },
    { id: '5', name: '龙岗坂田店', status: 'inactive' },
  ]);

  const [currentStoreId, setCurrentStoreId] = useState('1');

  useEffect(() => {
    // 从localStorage加载当前店铺
    const savedStoreId = localStorage.getItem('currentStoreId');
    if (savedStoreId) {
      setCurrentStoreId(savedStoreId);
    }
  }, []);

  const handleStoreChange = (storeId: string) => {
    setCurrentStoreId(storeId);
    localStorage.setItem('currentStoreId', storeId);
    // 刷新页面以应用新店铺
    window.location.reload();
  };

  return (
    <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {showStoreSelector && (
          <Select value={currentStoreId} onValueChange={handleStoreChange}>
            <SelectTrigger className="w-48 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  <div className="flex items-center gap-2">
                    <span>{store.name}</span>
                    {store.status !== 'active' && (
                      <span className="text-xs text-muted-foreground">
                        ({store.status === 'inactive' ? '停业' : '关闭'})
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
