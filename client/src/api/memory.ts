import products from '../memory/products.json';
import { Product } from '../types';

export async function fetchProductsFromMemory(): Promise<Product[]> {
  // In a real application, this could be a fetch call to an API endpoint
  // For now, we're reading directly from the JSON file
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(products as Product[]);
    }, 500);
  });
}
