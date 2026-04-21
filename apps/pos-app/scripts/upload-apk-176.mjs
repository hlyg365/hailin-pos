import { S3Storage } from "coze-coding-dev-sdk";
import * as fs from "fs";
import * as path from "path";

const storage = new S3Storage({
  bucketName: process.env.COZE_BUCKET_NAME,
});

async function main() {
  const apkPath = path.join(process.cwd(), "public", "hailin-pos-v1.0.182.apk");
  
  console.log("读取APK文件:", apkPath);
  const fileContent = fs.readFileSync(apkPath);
  
  console.log("上传到对象存储...");
  const key = await storage.uploadFile({
    fileContent: fileContent,
    fileName: "apk/hailin-pos-v1.0.182.apk",
    contentType: "application/vnd.android.package-archive",
  });
  
  console.log("上传成功，生成签名URL...");
  const url = await storage.generatePresignedUrl({
    key: key,
    expireTime: 7 * 24 * 60 * 60, // 7天
  });
  
  console.log("\n========================================");
  console.log("APK下载地址（7天有效）:");
  console.log(url);
  console.log("========================================\n");
}

main().catch(console.error);
