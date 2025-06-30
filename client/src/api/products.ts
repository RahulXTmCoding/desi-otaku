import { Product } from '../types';
import { fetchProductsFromMemory } from './memory';

export async function fetchProducts(): Promise<Product[]> {
  return fetchProductsFromMemory();
}
