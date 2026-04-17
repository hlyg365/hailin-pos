import { S3Storage } from "coze-coding-dev-sdk";
import { createReadStream, statSync } from "fs";
import { basename } from "path";

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

async function uploadFile(filePath: string) {
  const fileName = basename(filePath);
  const fileSize = statSync(filePath).size;
  
  console.log(`上传文件: ${fileName} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
  
  const stream = createReadStream(filePath);
  const key = await storage.streamUploadFile({
    stream,
    fileName,
    contentType: fileName.endsWith('.tar.gz') ? 'application/gzip' : 'application/octet-stream',
  });
  
  console.log(`上传成功，Key: ${key}`);
  
  // 生成7天有效的下载链接
  const downloadUrl = await storage.generatePresignedUrl({
    key,
    expireTime: 604800, // 7天
  });
  
  console.log(`\n下载链接 (有效期7天):\n${downloadUrl}`);
  
  return downloadUrl;
}

uploadFile("/workspace/projects/hailin-pos-dist.tar.gz")
  .then(url => {
    console.log("\n上传完成!");
    process.exit(0);
  })
  .catch(err => {
    console.error("上传失败:", err);
    process.exit(1);
  });
