'use client';

/**
 * AI 客服聊天组件
 * 支持流式输出、快捷问题、聊天历史
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  Bot,
  Send,
  Loader2,
  Sparkles,
  X,
  MessageCircle,
  HelpCircle,
  Package,
  Tag,
  CreditCard,
  Users,
  Settings,
  RotateCcw,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface AiAssistantChatProps {
  storeId?: string;
  onClose?: () => void;
  className?: string;
}

// 快捷问题
const QUICK_QUESTIONS = [
  { icon: HelpCircle, text: '如何使用会员折扣？', category: '会员' },
  { icon: Package, text: '有哪些促销活动？', category: '促销' },
  { icon: Tag, text: '今天有什么特价商品？', category: '商品' },
  { icon: CreditCard, text: '支持哪些支付方式？', category: '支付' },
];

export function AiAssistantChat({ storeId, onClose, className }: AiAssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '您好！我是海邻到家智能客服助手。我可以帮您解答关于商品、促销活动、会员权益、收银操作等问题。请问有什么可以帮您的？',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 发送消息
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // 添加一个空的 AI 消息用于流式填充
    const aiMessageId = `ai-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }]);

    try {
      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          storeId,
          searchKnowledge: true,
        }),
      });

      if (!response.ok) {
        throw new Error('请求失败');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应');

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              // 流结束
              setMessages(prev => prev.map(m => 
                m.id === aiMessageId 
                  ? { ...m, content: fullContent, isStreaming: false }
                  : m
              ));
            } else {
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  setMessages(prev => prev.map(m => 
                    m.id === aiMessageId 
                      ? { ...m, content: fullContent }
                      : m
                  ));
                } else if (parsed.error) {
                  setMessages(prev => prev.map(m => 
                    m.id === aiMessageId 
                      ? { ...m, content: `抱歉，${parsed.error}`, isStreaming: false }
                      : m
                  ));
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        }
      }

    } catch (error) {
      console.error('发送消息失败:', error);
      setMessages(prev => prev.map(m => 
        m.id === aiMessageId 
          ? { ...m, content: '抱歉，网络出现问题，请稍后再试。', isStreaming: false }
          : m
      ));
    } finally {
      setIsLoading(false);
    }
  }, [messages, storeId, isLoading]);

  // 处理回车发送
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  // 清空对话
  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: '对话已清空。请问有什么可以帮您的？',
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className={cn('flex flex-col h-full bg-white', className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold">智能客服</h3>
            <p className="text-xs text-white/80">随时为您解答问题</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={clearChat}
            className="text-white hover:bg-white/20"
            title="清空对话"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* 消息区域 */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              <Avatar className={cn(
                'h-8 w-8 shrink-0',
                message.role === 'user' ? 'bg-blue-500' : 'bg-gray-100'
              )}>
                <AvatarFallback className={cn(
                  message.role === 'user' ? 'text-white' : 'text-gray-600'
                )}>
                  {message.role === 'user' ? '我' : <Bot className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2.5',
                message.role === 'user'
                  ? 'bg-blue-500 text-white rounded-tr-md'
                  : 'bg-gray-100 text-gray-800 rounded-tl-md'
              )}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {message.content}
                  {message.isStreaming && (
                    <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse" />
                  )}
                </p>
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 bg-gray-100">
                <AvatarFallback className="text-gray-600">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-gray-100 rounded-2xl rounded-tl-md px-4 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 快捷问题 */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 border-t bg-gray-50">
          <p className="text-xs text-gray-500 mb-2">快捷问题</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map((q, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => sendMessage(q.text)}
                className="text-xs h-8 bg-white"
              >
                <q.icon className="h-3 w-3 mr-1" />
                {q.text}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 输入区域 */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入您的问题..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={() => sendMessage(inputValue)}
            disabled={!inputValue.trim() || isLoading}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * AI 客服浮动按钮组件
 */
export function AiAssistantButton({ storeId }: { storeId?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 浮动按钮 */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50',
          'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
          'transition-all duration-300',
          isOpen && 'scale-0'
        )}
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </Button>

      {/* 聊天窗口 */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] rounded-2xl shadow-2xl z-50 overflow-hidden border animate-in slide-in-from-bottom-4 duration-300">
          <AiAssistantChat
            storeId={storeId}
            onClose={() => setIsOpen(false)}
            className="h-full"
          />
        </div>
      )}

      {/* 背景遮罩 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

export default AiAssistantChat;
