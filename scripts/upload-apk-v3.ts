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
  const fileName = "hailin-pos-v3.0.apk";

  console.log("上传 APK...");

  // 使用流式上传
  const stream = createReadStream(apkPath);
  const key = await storage.streamUploadFile({
    stream,
    fileName,
    contentType: "application/vnd.android.package-archive",
  });

  console.log("上传完成!");
  console.log("\nKey:", key);
  
  // 生成不带签名的直接访问链接
  const directUrl = `https://${process.env.COZE_BUCKET_ENDPOINT_URL}/${process.env.COZE_BUCKET_NAME}/${key}`;
  console.log("\n直接下载链接:");
  console.log(directUrl);
}

uploadAPK().catch(console.error);
