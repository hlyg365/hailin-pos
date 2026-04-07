// 上传会话存储管理
// 使用全局变量确保跨请求共享会话数据

declare global {
  // eslint-disable-next-line no-var
  var uploadSessions: Map<string, {
    productId: string;
    createdAt: number;
    expiresAt: number;
    uploadedImages: Array<{ key: string; url: string }>;
    status: 'pending' | 'completed' | 'expired';
  }> | undefined;
}

// 获取或初始化全局会话存储
export function getUploadSessions() {
  if (!global.uploadSessions) {
    global.uploadSessions = new Map();
  }
  return global.uploadSessions;
}

// 清理过期会话
export function cleanupExpiredSessions() {
  const sessions = getUploadSessions();
  const now = Date.now();
  
  sessions.forEach((session, sessionId) => {
    if (now > session.expiresAt) {
      sessions.delete(sessionId);
    }
  });
}
