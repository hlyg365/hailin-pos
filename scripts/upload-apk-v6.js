const { S3Storage } = require('coze-coding-dev-sdk');
const { createReadStream } = require('fs');

async function uploadAPK() {
  const storage = new S3Storage({
    endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
    accessKey: "",
    secretKey: "",
    bucketName: process.env.COZE_BUCKET_NAME,
    region: "cn-beijing",
  });

  const apkPath = '/workspace/projects/out/hailin-pos-v3.1.2.apk';
  
  console.log('Creating read stream...');
  const stream = createReadStream(apkPath);
  
  console.log('Uploading APK (stream mode)...');
  const key = await storage.streamUploadFile({
    stream: stream,
    fileName: 'apk/hailin-pos-v3.1.1.apk',
    contentType: 'application/vnd.android.package-archive',
  });
  
  console.log('File uploaded, key:', key);
  
  console.log('Generating download URL...');
  const downloadUrl = await storage.generatePresignedUrl({
    key: key,
    expireTime: 604800, // 7 days
  });
  
  console.log('Download URL:', downloadUrl);
  
  // 保存URL到文件供后续使用
  require('fs').writeFileSync('/workspace/projects/apk-download-url.txt', downloadUrl);
  console.log('URL saved!');
}

uploadAPK().catch(console.error);
