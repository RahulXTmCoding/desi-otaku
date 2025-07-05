import { getLocalCart } from '../core/helper/cartHelper';

export const testCustomDesignInCart = () => {
  console.log('=== Testing Custom Design Cart Data ===');
  
  const cartItems = getLocalCart();
  console.log('Total cart items:', cartItems.length);
  
  cartItems.forEach((item, index) => {
    console.log(`\n--- Item ${index + 1} ---`);
    console.log('Name:', item.name);
    console.log('Is Custom?:', item.isCustom);
    console.log('Size:', item.size);
    console.log('Color:', item.color);
    console.log('Price:', item.price);
    console.log('Quantity:', item.quantity);
    
    if (item.customization) {
      console.log('Has customization data: YES');
      
      if (item.customization.frontDesign) {
        console.log('Front Design:', {
          designId: item.customization.frontDesign.designId,
          position: item.customization.frontDesign.position,
          price: item.customization.frontDesign.price,
          hasImage: !!item.customization.frontDesign.designImage
        });
      }
      
      if (item.customization.backDesign) {
        console.log('Back Design:', {
          designId: item.customization.backDesign.designId,
          position: item.customization.backDesign.position,
          price: item.customization.backDesign.price,
          hasImage: !!item.customization.backDesign.designImage
        });
      }
      
      if (item.customization.selectedProduct) {
        console.log('Selected Product ID:', item.customization.selectedProduct);
      }
    } else {
      console.log('Has customization data: NO');
    }
  });
  
  console.log('\n=== End Test ===');
};

// Auto-run when imported
if (typeof window !== 'undefined') {
  (window as any).testCustomDesignInCart = testCustomDesignInCart;
  console.log('Test function available: window.testCustomDesignInCart()');
}
