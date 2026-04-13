import { NextRequest, NextResponse } from 'next/server';
import { SettingsStore, SystemSettings, USBDevice, detectUSBDevices } from '@/lib/settings-store';

// GET - 获取设置
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'devices') {
      // 获取设备列表
      let devices = SettingsStore.getDevices();
      if (devices.length === 0) {
        // 如果没有缓存，检测设备
        devices = await detectUSBDevices();
        SettingsStore.saveDevices(devices);
      }
      return NextResponse.json({
        success: true,
        data: devices,
      });
    }

    // 获取系统设置
    const settings = SettingsStore.getSettings();
    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('获取设置失败:', error);
    return NextResponse.json(
      { success: false, error: '获取设置失败' },
      { status: 500 }
    );
  }
}

// POST - 更新设置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (type === 'settings') {
      SettingsStore.saveSettings(data as Partial<SystemSettings>);
      return NextResponse.json({
        success: true,
        message: '设置已保存',
      });
    }

    if (type === 'device') {
      const { deviceId, deviceType } = data;
      SettingsStore.updateDeviceType(deviceId, deviceType);
      return NextResponse.json({
        success: true,
        message: '设备类型已更新',
      });
    }

    if (type === 'reset') {
      SettingsStore.resetSettings();
      return NextResponse.json({
        success: true,
        message: '设置已重置',
      });
    }

    return NextResponse.json(
      { success: false, error: '未知操作类型' },
      { status: 400 }
    );
  } catch (error) {
    console.error('更新设置失败:', error);
    return NextResponse.json(
      { success: false, error: '更新设置失败' },
      { status: 500 }
    );
  }
}
