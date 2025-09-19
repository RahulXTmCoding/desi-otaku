// Test utility to verify JSON-based multi-image upload

export const testJsonMultiImageUpload = async () => {
  
  // Create test files
  const testFiles = [
    new File([new Blob(['red test data'])], 'red-test.png', { type: 'image/png' }),
    new File([new Blob(['green test data'])], 'green-test.png', { type: 'image/png' }),
    new File([new Blob(['blue test data'])], 'blue-test.png', { type: 'image/png' })
  ];
  
  // Convert to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };
  
  try {
    const base64Results = await Promise.all(
      testFiles.map(file => fileToBase64(file))
    );
    
    base64Results.forEach((result, index) => {
    });
    
    // Test payload structure
    const testPayload = {
      name: "Test Product",
      description: "Testing multiple images",
      price: "999",
      category: "test-category-id",
      productType: "test-type-id",
      tags: "test,multiple,images",
      sizeStock: { S: 10, M: 20, L: 15, XL: 10, XXL: 5 },
      imageUrls: [
        { url: "https://example.com/test1.jpg", isPrimary: false, order: 0 }
      ],
      imageFiles: base64Results.map((data, index) => ({
        data,
        type: 'image/png',
        name: testFiles[index].name,
        isPrimary: index === 1 // Make second image primary
      })),
      primaryImageIndex: 2 // Third image overall (1 URL + 2nd file)
    };
    
    
    return {
      success: true,
      message: "Multi-image test payload created successfully",
      payload: testPayload
    };
  } catch (error) {
    console.error("❌ Test failed:", error);
    return {
      success: false,
      error: error
    };
  }
};
