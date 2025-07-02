// Test utility to add items to cart for testing checkout
export const addTestItemsToCart = () => {
  const testItems = [
    {
      _id: 'test-1',
      name: 'Test T-Shirt 1',
      price: 599,
      quantity: 2,
      size: 'M',
      color: 'Black',
      colorValue: '#000000',
      image: 'https://via.placeholder.com/200'
    },
    {
      _id: 'test-2',
      name: 'Test T-Shirt 2',
      price: 699,
      quantity: 1,
      size: 'L',
      color: 'White',
      colorValue: '#FFFFFF',
      image: 'https://via.placeholder.com/200'
    }
  ];

  // Add items to cart
  localStorage.setItem('cart', JSON.stringify(testItems));
  
  // Reload page to update cart
  window.location.reload();
};

// Function to clear cart
export const clearTestCart = () => {
  localStorage.removeItem('cart');
  window.location.reload();
};
