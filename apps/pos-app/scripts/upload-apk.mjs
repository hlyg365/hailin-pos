import { S3Storage } from "coze-coding-dev-sdk";
import { createReadStream } from "fs";
import { join } from "path";

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

async function uploadAPK() {
  const apkPath = join(process.cwd(), "public", "hailin-pos-v1.0.155.apk");
  
  console.log("开始上传APK...");
  const stream = createReadStream(apkPath);
  
  const key = await storage.streamUploadFile({
    stream,
    fileName: "hailin-pos-v1.0.155.apk",
    contentType: "application/vnd.android.package-archive",
  });
  
  console.log("上传完成，Key:", key);
  
  // 生成7天有效的签名URL
  const url = await storage.generatePresignedUrl({
    key,
    expireTime: 604800, // 7天
  });
  
  console.log("\n下载链接（有效期7天）:");
  console.log(url);
}

uploadAPK().catch(console.error);
