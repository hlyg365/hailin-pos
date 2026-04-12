import { S3Storage } from "coze-coding-dev-sdk";
import { createReadStream } from "fs";
import path from "path";

async function uploadAPK() {
  const storage = new S3Storage({
    endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
    accessKey: "",
    secretKey: "",
    bucketName: process.env.COZE_BUCKET_NAME,
    region: "cn-beijing",
  });

  const apkPath = "/workspace/projects/android/app/build/outputs/apk/debug/app-debug.apk";
  const fileName = "hailin-pos-v3.0-realtime.apk";

  console.log("开始上传 APK...");

  // 使用流式上传
  const stream = createReadStream(apkPath);
  const key = await storage.streamUploadFile({
    stream,
    fileName,
    contentType: "application/vnd.android.package-archive",
  });

  console.log("上传完成，Key:", key);

  // 生成签名 URL (7天有效期)
  const downloadUrl = await storage.generatePresignedUrl({
    key,
    expireTime: 604800,
  });

  console.log("\n下载链接 (有效期7天):");
  console.log(downloadUrl);
}

uploadAPK().catch(console.error);
