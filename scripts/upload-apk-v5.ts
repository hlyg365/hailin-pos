import { S3Storage } from "coze-coding-dev-sdk";
import { createReadStream } from "fs";

async function uploadAPK() {
  const storage = new S3Storage({
    endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
    accessKey: "",
    secretKey: "",
    bucketName: process.env.COZE_BUCKET_NAME,
    region: "cn-beijing",
  });

  const apkPath = "/workspace/projects/android/app/build/outputs/apk/debug/app-debug.apk";
  const fileName = "hailin-pos-v3.0-final.apk";

  console.log("上传 APK...");

  const stream = createReadStream(apkPath);
  const key = await storage.streamUploadFile({
    stream,
    fileName,
    contentType: "application/vnd.android.package-archive",
  });

  console.log("上传完成!");
  console.log("\nKey:", key);
  
  // 生成永久下载链接（无过期时间）
  try {
    const downloadUrl = await storage.generatePresignedUrl({
      key,
      expireTime: 604800 * 2, // 14天
    });
    console.log("\n14天有效期下载链接:");
    console.log(downloadUrl);
  } catch (e) {
    console.log("生成签名链接失败，尝试其他方式...");
  }
  
  // 文件信息
  const fs = await import('fs');
  const stats = fs.statSync(apkPath);
  console.log("\n文件大小:", (stats.size / 1024 / 1024).toFixed(2), "MB");
}

uploadAPK().catch(console.error);
