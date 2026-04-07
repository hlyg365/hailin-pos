// 会员注册会话存储（内存存储，生产环境应使用Redis等）
interface RegisterSession {
  sessionId: string;
  status: 'pending' | 'completed';
  member?: {
    id?: string;
    phone: string;
    name: string;
    birthday?: string;
    gender?: string;
  };
  createdAt: number;
  completedAt?: number;
}

// 全局会话存储
const registerSessions = new Map<string, RegisterSession>();

// 清理过期会话（5分钟后过期）
setInterval(() => {
  const now = Date.now();
  for (const [key, session] of registerSessions.entries()) {
    if (now - session.createdAt > 5 * 60 * 1000) {
      registerSessions.delete(key);
    }
  }
}, 60 * 1000);

export function createSession(sessionId: string): RegisterSession {
  const session: RegisterSession = {
    sessionId,
    status: 'pending',
    createdAt: Date.now(),
  };
  registerSessions.set(sessionId, session);
  return session;
}

export function getSession(sessionId: string): RegisterSession | undefined {
  return registerSessions.get(sessionId);
}

export function completeSession(sessionId: string, member: RegisterSession['member']): RegisterSession | undefined {
  const session = registerSessions.get(sessionId);
  if (session) {
    session.status = 'completed';
    session.member = member;
    session.completedAt = Date.now();
    registerSessions.set(sessionId, session);
  }
  return session;
}
