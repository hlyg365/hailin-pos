/**
 * APK下载API
 * 
 * 提供APK文件下载服务
 * 支持版本验证和断点续传
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// APK文件路径（实际部署时配置）
const APK_DIR = process.env.APK_STORAGE_DIR || '/tmp/apk';
const CURRENT_APK = path.join(APK_DIR, 'hailin-pos-latest.apk');

// 版本信息
const VERSION_INFO = {
  version: '3.0.0',
  versionCode: 30,
  buildId: 'latest',
  buildTime: '2024-04-11T00:00:00Z',
  md5: '',
  size: 0,
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const version = searchParams.get('v') || VERSION_INFO.version;
  const checkOnly = searchParams.get('check') === 'true';
  
  // 如果是检查模式，只返回版本信息
  if (checkOnly) {
    return NextResponse.json({
      success: true,
      version: VERSION_INFO.version,
      versionCode: VERSION_INFO.versionCode,
      buildTime: VERSION_INFO.buildTime,
      size: VERSION_INFO.size,
      md5: VERSION_INFO.md5,
    });
  }
  
  try {
    // 尝试读取APK文件
    let apkPath = path.join(APK_DIR, `hailin-pos-${version}.apk`);
    
    // 尝试不同的文件名格式
    const possiblePaths = [
      apkPath,
      path.join(APK_DIR, 'hailin-pos-latest.apk'),
      path.join(APK_DIR, 'app-release.apk'),
      path.join(APK_DIR, 'app-debug.apk'),
    ];
    
    let actualPath = '';
    let fileStats = null;
    
    for (const p of possiblePaths) {
      try {
        fileStats = await fs.stat(p);
        actualPath = p;
        break;
      } catch {
        // 文件不存在，继续尝试下一个
      }
    }
    
    if (!actualPath || !fileStats) {
      // APK文件不存在，返回提示
      return NextResponse.json({
        success: false,
        error: 'APK文件不存在，请联系管理员',
        message: '新版本正在构建中，请稍后再试',
      }, { status: 404 });
    }
    
    // 获取文件信息
    const fileSize = fileStats.size;
    const fileBuffer = await fs.readFile(actualPath);
    
    // 生成简单的MD5（实际应该预计算）
    const md5 = `simulated_${version.replace(/\./g, '')}_${fileSize}`;
    
    // 检查是否支持断点续传
    const range = request.headers.get('range');
    
    if (range) {
      // 处理断点续传请求
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      
      const chunk = fileBuffer.slice(start, end + 1);
      
      return new NextResponse(chunk, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': 'application/vnd.android.package-archive',
          'Content-Disposition': `attachment; filename="hailin-pos-${version}.apk"`,
          'ETag': `"${md5}"`,
          'Last-Modified': new Date(fileStats.mtime).toUTCString(),
        },
      });
    }
    
    // 返回完整文件
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Length': fileSize.toString(),
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': `attachment; filename="hailin-pos-${version}.apk"`,
        'Accept-Ranges': 'bytes',
        'ETag': `"${md5}"`,
        'Last-Modified': new Date(fileStats.mtime).toUTCString(),
        'X-Version': VERSION_INFO.version,
        'X-Version-Code': VERSION_INFO.versionCode.toString(),
      },
    });
    
  } catch (error: any) {
    console.error('[Update Download] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: '下载失败',
      message: error.message || '服务器错误',
    }, { status: 500 });
  }
}

// 上传APK（仅管理员）
export async function POST(request: NextRequest) {
  // 简单的密钥验证（实际应该使用更安全的方式）
  const authHeader = request.headers.get('Authorization');
  const apiKey = process.env.UPDATE_API_KEY || 'hailin-pos-update-key';
  
  if (authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json({
      success: false,
      error: '未授权',
    }, { status: 401 });
  }
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const version = formData.get('version') as string;
    
    if (!file) {
      return NextResponse.json({
        success: false,
        error: '未上传文件',
      }, { status: 400 });
    }
    
    // 确保目录存在
    await fs.mkdir(APK_DIR, { recursive: true });
    
    // 保存文件
    const buffer = Buffer.from(await file.arrayBuffer());
    const apkPath = path.join(APK_DIR, `hailin-pos-${version || 'latest'}.apk`);
    
    await fs.writeFile(apkPath, buffer);
    
    return NextResponse.json({
      success: true,
      message: 'APK上传成功',
      version,
      size: buffer.length,
      path: apkPath,
    });
    
  } catch (error: any) {
    console.error('[Update Upload] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: '上传失败',
      message: error.message || '服务器错误',
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
