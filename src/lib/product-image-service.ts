/**
 * 商品图片管理服务
 * 支持主图和详情图的统一管理，多渠道共享（收银台、小程序、团购）
 * 
 * 重要：使用 Supabase 数据库持久化存储，确保重新部署后数据不丢失
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';

// 图片类型
export type ImageType = 'main' | 'detail';

// 使用渠道
export type ImageChannel = 'pos' | 'miniapp' | 'groupbuy' | 'all';

// 商品图片接口
export interface ProductImage {
  id: string;
  productId: string;
  type: ImageType;           // main: 主图, detail: 详情图
  imageKey: string;          // 对象存储key
  imageUrl: string;          // 访问URL
  sortOrder: number;         // 排序（详情图用）
  channels: ImageChannel[];  // 使用渠道
  isDefault: boolean;        // 是否默认主图
  uploadedBy: string;        // 上传人
  uploadedAt: string;        // 上传时间
  updatedAt: string;         // 更新时间
}

// 商品图片配置接口
export interface ProductImageConfig {
  productId: string;
  mainImage: ProductImage | null;     // 主图（收银台用）
  detailImages: ProductImage[];       // 详情图列表（小程序用）
}

// 数据库行类型
interface ProductImageRow {
  id: number;
  product_id: string;
  type: string;
  image_key: string;
  image_url: string | null;
  sort_order: number;
  channels: string; // JSON字符串
  is_default: boolean;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

// 获取Supabase客户端
function getDb() {
  try {
    return getSupabaseClient();
  } catch (error) {
    console.error('[ProductImageService] Failed to get Supabase client:', error);
    return null;
  }
}

// 数据库行转对象
function rowToImage(row: ProductImageRow): ProductImage {
  let channels: ImageChannel[] = ['all'];
  try {
    if (row.channels) {
      const parsed = JSON.parse(row.channels);
      if (Array.isArray(parsed)) {
        channels = parsed;
      }
    }
  } catch {
    // 解析失败使用默认值
  }

  return {
    id: `img_${row.id}`,
    productId: row.product_id,
    type: row.type as ImageType,
    imageKey: row.image_key,
    imageUrl: row.image_url || '',
    sortOrder: row.sort_order,
    channels,
    isDefault: row.is_default,
    uploadedBy: row.uploaded_by,
    uploadedAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// 生成唯一ID（用于前端展示）
function generateDisplayId(dbId: number): string {
  return `img_${dbId}`;
}

/**
 * 商品图片管理服务类
 * 使用 Supabase 数据库持久化存储
 */
export class ProductImageService {
  
  /**
   * 添加/更新商品图片
   * @param productId 商品ID
   * @param type 图片类型（main/detail）
   * @param imageKey 对象存储key
   * @param imageUrl 访问URL
   * @param channels 使用渠道
   * @param uploadedBy 上传人
   * @param sortOrder 排序（可选）
   */
  static async addProductImage(
    productId: string,
    type: ImageType,
    imageKey: string,
    imageUrl: string,
    channels: ImageChannel[] = ['all'],
    uploadedBy: string = 'system',
    sortOrder: number = 0
  ): Promise<ProductImage> {
    const db = getDb();
    
    if (!db) {
      // 数据库不可用时，返回临时对象（不持久化）
      console.warn('Database not available, image will not be persisted');
      return {
        id: `img_temp_${Date.now()}`,
        productId,
        type,
        imageKey,
        imageUrl,
        sortOrder,
        channels,
        isDefault: type === 'main',
        uploadedBy,
        uploadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    
    const now = new Date().toISOString();
    
    // 如果是主图，检查是否已有主图
    if (type === 'main') {
      const { data: existing } = await db
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .eq('type', 'main')
        .single();
      
      if (existing) {
        // 更新现有主图
        const { data, error } = await db
          .from('product_images')
          .update({
            image_key: imageKey,
            image_url: imageUrl,
            channels: JSON.stringify(channels),
            updated_at: now,
          })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) {
          console.error('Failed to update main image:', error);
          throw error;
        }
        
        return rowToImage(data);
      }
    }
    
    // 创建新图片记录
    const insertData: Record<string, unknown> = {
      product_id: productId,
      type,
      image_key: imageKey,
      image_url: imageUrl,
      sort_order: type === 'detail' ? await this.getNextSortOrder(productId) : 0,
      channels: JSON.stringify(channels),
      is_default: type === 'main',
      uploaded_by: uploadedBy,
      created_at: now,
      updated_at: now,
    };
    
    const { data, error } = await db
      .from('product_images')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Failed to insert image:', error);
      throw error;
    }
    
    return rowToImage(data);
  }
  
  /**
   * 获取下一个排序号
   */
  private static async getNextSortOrder(productId: string): Promise<number> {
    const db = getDb();
    if (!db) return 0;
    
    const { data } = await db
      .from('product_images')
      .select('sort_order')
      .eq('product_id', productId)
      .eq('type', 'detail')
      .order('sort_order', { ascending: false })
      .limit(1);
    
    if (data && data.length > 0) {
      return (data[0].sort_order || 0) + 1;
    }
    return 0;
  }
  
  /**
   * 获取商品图片配置
   * @param productId 商品ID
   */
  static async getProductImageConfig(productId: string): Promise<ProductImageConfig> {
    const db = getDb();
    
    if (!db) {
      return {
        productId,
        mainImage: null,
        detailImages: [],
      };
    }
    
    const { data, error } = await db
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true });
    
    if (error) {
      console.error('Failed to get product images:', error);
      return {
        productId,
        mainImage: null,
        detailImages: [],
      };
    }
    
    const images = (data || []).map(rowToImage);
    const mainImage = images.find(img => img.type === 'main') || null;
    const detailImages = images.filter(img => img.type === 'detail');
    
    return {
      productId,
      mainImage,
      detailImages,
    };
  }
  
  /**
   * 获取商品主图URL（供收银台使用）
   * @param productId 商品ID
   */
  static async getMainImageUrl(productId: string): Promise<string | null> {
    const config = await this.getProductImageConfig(productId);
    return config.mainImage?.imageUrl || null;
  }
  
  /**
   * 获取商品详情图列表（供小程序使用）
   * @param productId 商品ID
   */
  static async getDetailImageUrls(productId: string): Promise<string[]> {
    const config = await this.getProductImageConfig(productId);
    return config.detailImages.map(img => img.imageUrl);
  }
  
  /**
   * 更新图片排序
   * @param imageId 图片ID（格式：img_xxx）
   * @param newSortOrder 新排序
   */
  static async updateImageSort(imageId: string, newSortOrder: number): Promise<boolean> {
    const db = getDb();
    if (!db) return false;
    
    const dbId = this.extractDbId(imageId);
    if (!dbId) return false;
    
    const { error } = await db
      .from('product_images')
      .update({
        sort_order: newSortOrder,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dbId);
    
    return !error;
  }
  
  /**
   * 删除图片
   * @param imageId 图片ID（格式：img_xxx）
   */
  static async deleteImage(imageId: string): Promise<boolean> {
    const db = getDb();
    if (!db) return false;
    
    const dbId = this.extractDbId(imageId);
    if (!dbId) return false;
    
    const { error } = await db
      .from('product_images')
      .delete()
      .eq('id', dbId);
    
    return !error;
  }
  
  /**
   * 设置默认主图
   * @param imageId 图片ID
   */
  static async setDefaultMainImage(imageId: string): Promise<boolean> {
    const db = getDb();
    if (!db) return false;
    
    const dbId = this.extractDbId(imageId);
    if (!dbId) return false;
    
    const { error } = await db
      .from('product_images')
      .update({
        is_default: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dbId);
    
    return !error;
  }
  
  /**
   * 批量添加详情图
   * @param productId 商品ID
   * @param images 图片列表 [{ imageKey, imageUrl }]
   * @param uploadedBy 上传人
   */
  static async batchAddDetailImages(
    productId: string,
    images: Array<{ imageKey: string; imageUrl: string }>,
    uploadedBy: string = 'system'
  ): Promise<ProductImage[]> {
    const db = getDb();
    
    if (!db) {
      return images.map((img, index) => ({
        id: `img_temp_${Date.now()}_${index}`,
        productId,
        type: 'detail' as ImageType,
        imageKey: img.imageKey,
        imageUrl: img.imageUrl,
        sortOrder: index,
        channels: ['miniapp'] as ImageChannel[],
        isDefault: false,
        uploadedBy,
        uploadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    }
    
    const now = new Date().toISOString();
    const currentSortOrder = await this.getNextSortOrder(productId);
    
    const insertData = images.map((img, index) => ({
      product_id: productId,
      type: 'detail',
      image_key: img.imageKey,
      image_url: img.imageUrl,
      sort_order: currentSortOrder + index,
      channels: JSON.stringify(['miniapp']),
      is_default: false,
      uploaded_by: uploadedBy,
      created_at: now,
      updated_at: now,
    }));
    
    const { data, error } = await db
      .from('product_images')
      .insert(insertData)
      .select();
    
    if (error) {
      console.error('Failed to batch insert images:', error);
      throw error;
    }
    
    return (data || []).map(rowToImage);
  }
  
  /**
   * 更新图片使用渠道
   * @param imageId 图片ID
   * @param channels 新的渠道列表
   */
  static async updateImageChannels(imageId: string, channels: ImageChannel[]): Promise<boolean> {
    const db = getDb();
    if (!db) return false;
    
    const dbId = this.extractDbId(imageId);
    if (!dbId) return false;
    
    const { error } = await db
      .from('product_images')
      .update({
        channels: JSON.stringify(channels),
        updated_at: new Date().toISOString(),
      })
      .eq('id', dbId);
    
    return !error;
  }
  
  /**
   * 获取所有商品图片（供管理后台使用）
   */
  static async getAllProductImages(): Promise<Map<string, ProductImage[]>> {
    const db = getDb();
    const result = new Map<string, ProductImage[]>();
    
    if (!db) return result;
    
    const { data, error } = await db
      .from('product_images')
      .select('*')
      .order('product_id', { ascending: true })
      .order('sort_order', { ascending: true });
    
    if (error) {
      console.error('Failed to get all images:', error);
      return result;
    }
    
    (data || []).forEach(row => {
      const image = rowToImage(row);
      const existing = result.get(image.productId) || [];
      existing.push(image);
      result.set(image.productId, existing);
    });
    
    return result;
  }
  
  /**
   * 根据渠道获取商品图片
   * @param productId 商品ID
   * @param channel 渠道
   */
  static async getImagesByChannel(productId: string, channel: ImageChannel): Promise<ProductImage[]> {
    const config = await this.getProductImageConfig(productId);
    const allImages = [config.mainImage, ...config.detailImages].filter(Boolean) as ProductImage[];
    
    return allImages.filter(img => 
      img.channels.includes('all') || img.channels.includes(channel)
    );
  }
  
  /**
   * 更新图片URL（用于刷新预签名URL）
   * @param imageId 图片ID
   * @param imageUrl 新的URL
   */
  static async updateImageUrl(imageId: string, imageUrl: string): Promise<boolean> {
    const db = getDb();
    if (!db) return false;
    
    const dbId = this.extractDbId(imageId);
    if (!dbId) return false;
    
    const { error } = await db
      .from('product_images')
      .update({
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dbId);
    
    return !error;
  }
  
  /**
   * 根据imageKey获取图片记录
   * @param imageKey 对象存储key
   */
  static async getImageByKey(imageKey: string): Promise<ProductImage | null> {
    const db = getDb();
    if (!db) return null;
    
    const { data, error } = await db
      .from('product_images')
      .select('*')
      .eq('image_key', imageKey)
      .single();
    
    if (error || !data) return null;
    
    return rowToImage(data);
  }
  
  /**
   * 从图片ID提取数据库ID
   */
  private static extractDbId(imageId: string): number | null {
    if (imageId.startsWith('img_')) {
      const id = parseInt(imageId.substring(4), 10);
      return isNaN(id) ? null : id;
    }
    // 如果是纯数字
    const num = parseInt(imageId, 10);
    return isNaN(num) ? null : num;
  }
}

// 导出便捷函数（保持向后兼容，但现在是异步的）
export const addProductImage = ProductImageService.addProductImage;
export const getProductImageConfig = ProductImageService.getProductImageConfig;
export const getMainImageUrl = ProductImageService.getMainImageUrl;
export const getDetailImageUrls = ProductImageService.getDetailImageUrls;
export const updateImageSort = ProductImageService.updateImageSort;
export const deleteImage = ProductImageService.deleteImage;
export const batchAddDetailImages = ProductImageService.batchAddDetailImages;
