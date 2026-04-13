import { NextResponse } from 'next/server';
import { SettingsStore, detectUSBDevices } from '@/lib/settings-store';

// GET - 检测USB设备
export async function GET() {
  try {
    // 检测设备
    const devices = await detectUSBDevices();
    
    // 保存到本地存储
    SettingsStore.saveDevices(devices);

    return NextResponse.json({
      success: true,
      data: devices,
      message: `检测到 ${devices.length} 个USB设备`,
    });
  } catch (error) {
    console.error('检测设备失败:', error);
    return NextResponse.json(
      { success: false, error: '检测设备失败' },
      { status: 500 }
    );
  }
}
