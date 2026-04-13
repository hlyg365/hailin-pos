import { MetadataRoute } from 'next';

export const dynamic = 'force-static';
export const revalidate = false;

/**
 * robots.txt 配置
 * 内部管理系统，禁止搜索引擎索引
 * 不暴露技术栈信息
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: '/',
    },
  };
}
