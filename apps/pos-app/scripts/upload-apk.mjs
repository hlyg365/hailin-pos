import { S3Storage } from "coze-coding-dev-sdk";
import { createReadStream } from "fs";
import { join, basename } from "path";
import { readdirSync } from "fs";

// 初始化存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

async function uploadLatestAPK() {
  const publicDir = join(process.cwd(), "public");
  
  // 查找最新的APK文件
  const files = readdirSync(publicDir)
    .filter(f => f.endsWith('.apk'))
    .sort()
    .reverse();
  
  if (files.length === 0) {
    console.error("未找到APK文件！");
    process.exit(1);
  }
  
  const latestAPK = files[0];
  const apkPath = join(publicDir, latestAPK);
  
  console.log(`上传APK: ${latestAPK}`);
  console.log("开始上传...");
  
  const stream = createReadStream(apkPath);
  
  const key = await storage.streamUploadFile({
    stream,
    fileName: latestAPK,
    contentType: "application/vnd.android.package-archive",
  });
  
  console.log("上传完成！");
  
  // 生成7天有效的签名URL
  const url = await storage.generatePresignedUrl({
    key,
    expireTime: 604800, // 7天
  });
  
  console.log("\n========================================");
  console.log("📦 外网下载地址（有效期7天）:");
  console.log("========================================");
  console.log(url);
  console.log("========================================\n");
}

// 执行
uploadLatestAPK().catch(err => {
  console.error("上传失败:", err);
  process.exit(1);
});
