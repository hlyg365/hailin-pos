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

async function uploadArchitectureDoc() {
  const docPath = join(process.cwd(), "ARCHITECTURE.md");
  const fileName = "ARCHITECTURE.md";
  
  console.log(`上传文档: ${fileName}`);
  console.log("开始上传...");
  
  const stream = createReadStream(docPath);
  
  const key = await storage.streamUploadFile({
    stream,
    fileName: fileName,
    contentType: "text/markdown",
  });
  
  console.log("上传完成！");
  
  // 生成7天有效的签名URL
  const url = await storage.generatePresignedUrl({
    key,
    expireTime: 604800, // 7天
  });
  
  console.log("\n========================================");
  console.log("外网下载地址（有效期7天）:");
  console.log("========================================");
  console.log(url);
  console.log("========================================\n");
}

uploadArchitectureDoc().catch(err => {
  console.error("上传失败:", err);
  process.exit(1);
});
