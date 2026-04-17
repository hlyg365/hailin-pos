import { Product, ProductCategory } from '@hailin/core';

export interface ProductService {
  getProducts(params?: {
    categoryId?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ list: Product[]; total: number }>;
  
  getProductById(id: string): Promise<Product>;
  
  getProductByBarcode(barcode: string): Promise<Product>;
  
  getCategories(): Promise<ProductCategory[]>;
  
  updateStock(id: string, quantity: number): Promise<void>;
}
