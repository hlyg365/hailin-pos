import { useState, useCallback } from 'react';
import { Product } from '@hailin/core';

export function useProduct() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const searchProducts = useCallback(async (keyword: string) => {
    setLoading(true);
    try {
      // 实际调用API
      // const res = await api.get('/products', { keyword });
      // setProducts(res.data);
      console.log('Search:', keyword);
    } finally {
      setLoading(false);
    }
  }, []);

  const getProductByBarcode = useCallback(async (barcode: string): Promise<Product | null> => {
    setLoading(true);
    try {
      // 实际调用API
      // const res = await api.post('/products/barcode', { barcode });
      // return res.data;
      console.log('Barcode:', barcode);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, products, searchProducts, getProductByBarcode };
}
