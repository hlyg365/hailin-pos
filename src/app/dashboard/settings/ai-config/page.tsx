'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Barcode,
  Bot,
  MessageSquare,
  Image,
  Sparkles,
  FileText,
  ChevronRight,
  Check,
  AlertCircle,
} from 'lucide-react';

// AI功能配置项
const aiFeatures = [
  {
    id: 'barcode-recognition',
    title: '条码识别',
    description: '配置第三方条码查询API，提升商品扫码识别准确率',
    icon: Barcode,
    href: '/settings/ai-config/barcode-api',
    status: 'available', // available, configured, coming-soon
    tags: ['已上线', '核心功能'],
  },
  {
    id: 'ai-assistant',
    title: 'AI智能客服',
    description: '配置AI客服机器人，自动回答顾客常见问题',
    icon: Bot,
    href: '/settings/ai-config/assistant',
    status: 'coming-soon',
    tags: ['敬请期待'],
  },
  {
    id: 'smart-recommend',
    title: '智能推荐',
    description: '基于销售数据的AI商品推荐系统',
    icon: Sparkles,
    href: '/settings/ai-config/recommend',
    status: 'coming-soon',
    tags: ['敬请期待'],
  },
  {
    id: 'image-recognition',
    title: '图像识别',
    description: 'AI图像识别，支持商品图片自动识别',
    icon: Image,
    href: '/settings/ai-config/image',
    status: 'available',
    tags: ['已上线'],
  },
  {
    id: 'voice-service',
    title: '语音服务',
    description: 'AI语音播报、语音识别配置',
    icon: MessageSquare,
    href: '/settings/ai-config/voice',
    status: 'coming-soon',
    tags: ['敬请期待'],
  },
  {
    id: 'document-ai',
    title: '文档智能',
    description: 'AI文档解析、合同识别等功能配置',
    icon: FileText,
    href: '/settings/ai-config/document',
    status: 'coming-soon',
    tags: ['敬请期待'],
  },
];

export default function AIConfigPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI功能配置"
        description="配置系统AI功能，提升智能化水平"
      />

      {/* 说明卡片 */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Bot className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">AI能力中心</p>
              <p>集中管理所有AI相关功能配置。配置后所有店铺均可使用，提升智能化运营水平。</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI功能列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {aiFeatures.map((feature) => {
          const Icon = feature.icon;
          const isAvailable = feature.status === 'available';
          const isConfigured = feature.status === 'configured';
          const isComingSoon = feature.status === 'coming-soon';

          return (
            <Card 
              key={feature.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isComingSoon ? 'opacity-70' : 'hover:border-blue-300'
              }`}
              onClick={() => {
                if (isAvailable || isConfigured) {
                  router.push(feature.href);
                }
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg ${
                    isAvailable ? 'bg-blue-100' : 
                    isConfigured ? 'bg-green-100' : 
                    'bg-gray-100'
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      isAvailable ? 'text-blue-600' : 
                      isConfigured ? 'text-green-600' : 
                      'text-gray-400'
                    }`} />
                  </div>
                  <div className="flex gap-1">
                    {feature.tags.map((tag, index) => (
                      <Badge 
                        key={index}
                        variant={tag === '已上线' ? 'default' : 'secondary'}
                        className={`text-xs ${
                          tag === '已上线' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 
                          tag === '核心功能' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 
                          ''
                        }`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <CardTitle className="text-base mt-3">{feature.title}</CardTitle>
                <CardDescription className="text-sm">{feature.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    {isConfigured ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-green-600">已配置</span>
                      </>
                    ) : isAvailable ? (
                      <>
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <span className="text-amber-600">待配置</span>
                      </>
                    ) : (
                      <span className="text-gray-400">即将上线</span>
                    )}
                  </div>
                  {(isAvailable || isConfigured) && (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 功能规划说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">功能规划</CardTitle>
          <CardDescription>更多AI功能正在开发中，敬请期待</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>已上线</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>开发中</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span>规划中</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              <span>待评估</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
