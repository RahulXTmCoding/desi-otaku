import { loadCart } from '../core/helper/cartHelper';

export const testCustomDesignInCart = () => {
  console.log('=== Testing Custom Design Cart Data ===');
  
  const cartItems = loadCart();
  console.log('Total cart items:', cartItems.length);
  
  cartItems.forEach((item, index) => {
    console.log(`\n--- Item ${index + 1} ---`);
    console.log('Name:', item.name);
    console.log('Is Custom?:', item.isCustom || item.category === 'custom');
    
    if (item.customization) {
      console.log('Has customization data: YES');
      
      if (item.customization.frontDesign) {
        console.log('Front Design:', {
          designId: item.customization.frontDesign.designId,
          position: item.customization.frontDesign.position,
          hasImage: !!item.customization.frontDesign.designImage
        });
      }
      
      if (item.customization.backDesign) {
        console.log('Back Design:', {
          designId: item.customization.backDesign.designId,
          position: item.customization.backDesign.position,
          hasImage: !!item.customization.backDesign.designImage
        });
      }
    } else {
      console.log('Has customization data: NO');
      if (item.design) {
        console.log('Legacy design:', item.design);
      }
    }
  });
  
  console.log('\n=== End Test ===');
};

// Auto-run when imported
if (typeof window !== 'undefined') {
  (window as any).testCustomDesignInCart = testCustomDesignInCart;
  console.log('Test function available: window.testCustomDesignInCart()');
}
