import { S3Storage } from "coze-coding-dev-sdk";
import { readFileSync } from "fs";

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  bucketName: process.env.COZE_BUCKET_NAME,
});

async function main() {
  const fileBuffer = readFileSync("/tmp/hailin-apk/app-debug.apk");
  const key = await storage.uploadFile({
    fileContent: fileBuffer,
    fileName: "hailin-pos-v50.apk",
    contentType: "application/vnd.android.package-archive",
  });
  console.log("Key:", key);
  
  const url = await storage.generatePresignedUrl({
    key,
    expireTime: 2592000, // 30 days
  });
  console.log("Download URL:", url);
}

main().catch(console.error);
