// 上传会话存储工具

// 内存存储上传会话（生产环境应使用Redis或数据库）
// 格式: { token: { status: 'pending' | 'uploaded', imageUrl?: string, createdAt: number } }
const uploadSessions = new Map<string, { status: string; imageUrl?: string; fileKey?: string; createdAt: number }>();

// 定期清理过期会话（5分钟过期）
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [token, session] of uploadSessions.entries()) {
      if (now - session.createdAt > 5 * 60 * 1000) {
        uploadSessions.delete(token);
      }
    }
  }, 60000); // 每分钟清理一次
}

// 获取存储的会话
export function getUploadSession(token: string) {
  return uploadSessions.get(token);
}

// 设置会话
export function setUploadSession(token: string, data: { status: string; imageUrl?: string; fileKey?: string }) {
  uploadSessions.set(token, { ...data, createdAt: Date.now() });
}

// 清理会话
export function deleteUploadSession(token: string) {
  uploadSessions.delete(token);
}
