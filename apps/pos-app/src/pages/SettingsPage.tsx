import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSettingsStore, useAiConfigStore } from '../store';

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettingsStore();
  const { configs, updateConfig, addConfig, deleteConfig } = useAiConfigStore();
  const [activeTab, setActiveTab] = useState<'basic' | 'payment' | 'promotion' | 'system' | 'ai'>('basic');
  const [hasChanges, setHasChanges] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    apiUrl: '',
    apiKey: '',
    method: 'GET',
    enabled: true,
  });

  useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  const handleChange = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    setTempSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettings(tempSettings);
    setHasChanges(false);
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2000);
  };

  const handleSaveAiConfig = () => {
    setHasChanges(false);
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2000);
  };

  const handleReset = () => {
    if (confirm('确定要恢复默认设置吗？')) {
      resetSettings();
      setHasChanges(false);
    }
  };

  const handleAddConfig = () => {
    setFormData({ name: '', apiUrl: '', apiKey: '', method: 'GET', enabled: true });
    setEditingIndex(null);
    setShowAddModal(true);
  };

  const handleEditConfig = (index: number) => {
    const config = configs[index];
    setFormData({
      name: config.name || '',
      apiUrl: config.apiUrl,
      apiKey: config.apiKey || '',
      method: config.method,
      enabled: config.enabled,
    });
    setEditingIndex(index);
    setShowAddModal(true);
  };

  const handleSaveConfig = () => {
    if (!formData.apiUrl) {
      alert('请输入API接口地址');
      return;
    }
    if (editingIndex !== null) {
      updateConfig(editingIndex, {
        name: formData.name,
        apiUrl: formData.apiUrl,
        apiKey: formData.apiKey,
        method: formData.method as 'GET' | 'POST',
        enabled: formData.enabled,
      });
    } else {
      addConfig({
        name: formData.name,
        apiUrl: formData.apiUrl,
        apiKey: formData.apiKey,
        method: formData.method as 'GET' | 'POST',
        enabled: formData.enabled,
        appCode: '',
        appSecret: '',
        timeout: 10,
        requestTemplate: '{"barcode": "${barcode}"}',
        responseMapping: { name: 'goods_name', category: 'category', price: 'price', costPrice: '', image: 'image' },
        callCount: 0,
        successCount: 0,
        lastTestResult: null,
      });
    }
    setShowAddModal(false);
    handleSaveAiConfig();
  };

  const handleToggleEnabled = (index: number) => {
    updateConfig(index, { enabled: !configs[index].enabled });
    handleSaveAiConfig();
  };

  const tabs = [
    { id: 'basic', label: '门店', icon: '🏪' },
    { id: 'payment', label: '支付', icon: '💳' },
    { id: 'promotion', label: '促销', icon: '🎉' },
    { id: 'ai', label: 'AI识别', icon: '🤖' },
    { id: 'system', label: '系统', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toast 提示 */}
      {showSaveToast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">
          ✅ 设置已保存
        </div>
      )}

      {/* 顶部导航 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/pos/cashier" className="text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="海邻到家" className="h-8 w-auto" />
              <span className="font-semibold">系统设置</span>
            </div>
            <div className="w-6"></div>
          </div>
        </div>

        {/* Tab 切换 */}
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex border-b">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 门店设置 */}
        {activeTab === 'basic' && (
          <div className="space-y-4">
            <SectionCard title="门店信息">
              <InputField
                label="门店名称"
                value={tempSettings.storeName}
                onChange={(v) => handleChange('storeName', v)}
                placeholder="请输入门店名称"
              />
              <InputField
                label="门店编码"
                value={tempSettings.storeCode}
                onChange={(v) => handleChange('storeCode', v)}
                placeholder="请输入门店编码"
              />
              <InputField
                label="门店地址"
                value={tempSettings.storeAddress}
                onChange={(v) => handleChange('storeAddress', v)}
                placeholder="请输入门店地址"
              />
              <InputField
                label="联系电话"
                value={tempSettings.storePhone}
                onChange={(v) => handleChange('storePhone', v)}
                placeholder="请输入联系电话"
              />
              <InputField
                label="店长姓名"
                value={tempSettings.storeManager}
                onChange={(v) => handleChange('storeManager', v)}
                placeholder="请输入店长姓名"
              />
            </SectionCard>

            <SectionCard title="营业时间">
              <ToggleField
                label="24小时营业"
                description="门店是否24小时营业"
                checked={tempSettings.is24Hours}
                onChange={(v) => handleChange('is24Hours', v)}
              />
              {!tempSettings.is24Hours && (
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="营业开始"
                    type="time"
                    value={tempSettings.businessStartTime}
                    onChange={(v) => handleChange('businessStartTime', v)}
                  />
                  <InputField
                    label="营业结束"
                    type="time"
                    value={tempSettings.businessEndTime}
                    onChange={(v) => handleChange('businessEndTime', v)}
                  />
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {/* 支付设置 */}
        {activeTab === 'payment' && (
          <div className="space-y-4">
            <SectionCard title="支付方式">
              <ToggleField
                label="微信支付"
                description="启用微信支付收款"
                checked={tempSettings.enableWechatPay}
                onChange={(v) => handleChange('enableWechatPay', v)}
              />
              <ToggleField
                label="支付宝"
                description="启用支付宝收款"
                checked={tempSettings.enableAlipay}
                onChange={(v) => handleChange('enableAlipay', v)}
              />
              <ToggleField
                label="云闪付"
                description="启用云闪付收款"
                checked={tempSettings.enableUnionPay}
                onChange={(v) => handleChange('enableUnionPay', v)}
              />
              <ToggleField
                label="现金支付"
                description="启用现金收款"
                checked={tempSettings.enableCash}
                onChange={(v) => handleChange('enableCash', v)}
              />
              <ToggleField
                label="会员卡支付"
                description="允许会员卡余额支付"
                checked={tempSettings.enableMemberCard}
                onChange={(v) => handleChange('enableMemberCard', v)}
              />
              <ToggleField
                label="数字人民币"
                description="启用数字人民币收款"
                checked={tempSettings.enableDigitalRMB}
                onChange={(v) => handleChange('enableDigitalRMB', v)}
              />
            </SectionCard>

            <SectionCard title="会员服务">
              <ToggleField
                label="会员折扣"
                description="启用会员等级折扣"
                checked={tempSettings.enableMemberDiscount}
                onChange={(v) => handleChange('enableMemberDiscount', v)}
              />
              <ToggleField
                label="积分系统"
                description="消费累积积分"
                checked={tempSettings.enablePointSystem}
                onChange={(v) => handleChange('enablePointSystem', v)}
              />
            </SectionCard>
          </div>
        )}

        {/* 促销设置 */}
        {activeTab === 'promotion' && (
          <div className="space-y-4">
            <SectionCard title="晚8点清货模式">
              <ToggleField
                label="启用清货模式"
                description="20:00-23:00 自动8折"
                checked={tempSettings.enableClearanceMode}
                onChange={(v) => handleChange('enableClearanceMode', v)}
              />
              {tempSettings.enableClearanceMode && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <div className="text-green-800 font-medium">清货模式说明</div>
                  <div className="text-green-600 text-sm mt-1">
                    启用后，每天晚上8点至11点期间，全场商品自动享受 {Math.round((1 - tempSettings.clearanceDiscount) * 100)}% 折扣优惠。
                  </div>
                </div>
              )}
            </SectionCard>

            <SectionCard title="促销活动">
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🎁</div>
                <p>促销活动配置</p>
                <p className="text-sm mt-1">可在总部后台配置更多促销规则</p>
                <Link
                  to="/dashboard/promotion"
                  className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
                >
                  前往促销管理
                </Link>
              </div>
            </SectionCard>
          </div>
        )}

        {/* 系统设置 */}
        {activeTab === 'system' && (
          <div className="space-y-4">
            <SectionCard title="硬件设备">
              <ToggleField
                label="启用打印机"
                description="自动打印小票"
                checked={tempSettings.printerEnabled}
                onChange={(v) => handleChange('printerEnabled', v)}
              />
              {tempSettings.printerEnabled && (
                <InputField
                  label="打印机名称"
                  value={tempSettings.printerName}
                  onChange={(v) => handleChange('printerName', v)}
                  placeholder="请输入打印机名称"
                />
              )}
              <ToggleField
                label="自动打印小票"
                description="交易完成后自动打印"
                checked={tempSettings.autoPrintReceipt}
                onChange={(v) => handleChange('autoPrintReceipt', v)}
              />
            </SectionCard>

            <SectionCard title="系统偏好">
              <ToggleField
                label="语音播报"
                description="交易完成后语音播报金额"
                checked={tempSettings.voiceEnabled}
                onChange={(v) => handleChange('voiceEnabled', v)}
              />
              <ToggleField
                label="自动同步"
                description="网络恢复后自动同步离线数据"
                checked={tempSettings.autoSync}
                onChange={(v) => handleChange('autoSync', v)}
              />
              <ToggleField
                label="离线收银"
                description="启用断网后继续收银功能"
                checked={tempSettings.offlineMode}
                onChange={(v) => handleChange('offlineMode', v)}
              />
            </SectionCard>

            {/* AI条码识别配置 */}
            <SectionCard title="AI条码识别平台">
              <div className="space-y-3">
                {configs.map((config, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${config.enabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleEnabled(index)}
                          className={`w-10 h-6 rounded-full transition-colors ${config.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${config.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                        <span className="font-medium">{config.name || `平台${index + 1}`}</span>
                        {config.enabled && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">使用中</span>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditConfig(index)} className="text-blue-500 text-sm">编辑</button>
                        {configs.length > 1 && (
                          <button onClick={() => { deleteConfig(index); handleSaveAiConfig(); }} className="text-red-500 text-sm">删除</button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 truncate">{config.apiUrl}</p>
                    {config.apiKey && <p className="text-xs text-gray-400 mt-1">Key: {config.apiKey.slice(0, 8)}***</p>}
                  </div>
                ))}
                <button onClick={handleAddConfig} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2">
                  <span className="text-xl">+</span> 添加识别平台
                </button>
              </div>
            </SectionCard>

            <SectionCard title="接口说明">
              <div className="text-sm text-gray-600 space-y-2">
                <p>• 支持添加多个AI条码识别平台</p>
                <p>• 开启多个平台时，系统按顺序自动切换使用</p>
                <p>• 当前推荐接口：apione.apibyte.cn</p>
                <p>• 支持格式：{`{code:200, data:{goods_name,category,price,image}}`}</p>
              </div>
            </SectionCard>

            <SectionCard title="关于">
              <div className="text-center py-4">
                <img src="/logo.png" alt="海邻到家" className="w-16 h-16 mx-auto mb-2" />
                <div className="font-semibold">海邻到家</div>
                <div className="text-sm text-gray-500">智慧门店系统 V6.0</div>
                <div className="text-xs text-gray-400 mt-2">构建零售新体验</div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* 保存按钮 */}
        {hasChanges && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
            <div className="max-w-2xl mx-auto flex gap-3">
              {activeTab !== 'ai' && (
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                >
                  恢复默认
                </button>
              )}
              <button
                onClick={activeTab === 'ai' ? handleSaveAiConfig : handleSave}
                className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium"
              >
                保存设置
              </button>
            </div>
          </div>
        )}

        {/* 底部退出登录 */}
        <div className="mt-8">
          <Link
            to="/pos/login"
            className="block w-full py-3 bg-red-50 text-red-500 text-center rounded-xl font-medium"
          >
            退出登录
          </Link>
        </div>
      </main>

      {/* 添加/编辑平台模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
              <h3 className="font-semibold">{editingIndex !== null ? '编辑识别平台' : '添加识别平台'}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <InputField label="平台名称" value={formData.name} onChange={(v) => setFormData({ ...formData, name: v })} placeholder="如：阿里云市场" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API接口地址 *</label>
                <input
                  type="text"
                  value={formData.apiUrl}
                  onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                  placeholder="https://api.example.com/barcode"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <InputField label="API Key" value={formData.apiKey} onChange={(v) => setFormData({ ...formData, apiKey: v })} placeholder="可选，填了可提高调用额度" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">请求方式</label>
                <select
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">启用此平台</span>
                <button
                  onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
                  className={`w-12 h-6 rounded-full transition-colors ${formData.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
            <div className="px-4 py-3 bg-gray-50 border-t flex gap-3">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg">取消</button>
              <button onClick={handleSaveConfig} className="flex-1 py-2 bg-blue-500 text-white rounded-lg">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 分组卡片组件
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b">
        <h3 className="font-medium text-gray-800">{title}</h3>
      </div>
      <div className="p-4 space-y-4">
        {children}
      </div>
    </div>
  );
}

// 输入框组件
function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
      />
    </div>
  );
}

// 开关组件
function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium text-gray-800">{label}</div>
        <div className="text-sm text-gray-500">{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-blue-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            checked ? 'left-7' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}
