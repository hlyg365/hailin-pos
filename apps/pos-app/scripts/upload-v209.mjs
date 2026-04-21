import { S3Storage } from "coze-coding-dev-sdk";
import * as fs from "fs";
import * as path from "path";

const storage = new S3Storage({
  bucketName: process.env.COZE_BUCKET_NAME,
});

async function main() {
  const apkPath = path.join(process.cwd(), "public", "hailin-pos-v1.0.209.apk");
  const fileContent = fs.readFileSync(apkPath);
  
  console.log("APK大小:", (fileContent.length / 1024 / 1024).toFixed(2), "MB");
  const key = await storage.uploadFile({
    fileContent: fileContent,
    fileName: "apk/hailin-pos-v1.0.209.apk",
    contentType: "application/vnd.android.package-archive",
  });
  
  const url = await storage.generatePresignedUrl({
    key: key,
    expireTime: 7 * 24 * 60 * 60,
  });
  
  console.log("\n========================================");
  console.log("APK下载地址（7天有效）:");
  console.log(url);
  console.log("========================================\n");
}

main().catch(console.error);
