// Debug utility to inspect FormData before sending

export const debugFormData = (formData: FormData) => {
  
  // Method 1: Using entries()
  let entriesCount = 0;
  for (let [key, value] of formData.entries()) {
    entriesCount++;
    if (value instanceof File) {
    } else {
    }
  }
  
  // Method 2: Using getAll() for 'images'
  const allImages = formData.getAll('images');
  allImages.forEach((img, idx) => {
    if (img instanceof File) {
    } else {
    }
  });
  
  // Method 3: Check if FormData has the files
  
  // Method 4: Create a test request to see what would be sent
  try {
    const testRequest = new Request('http://test.com', {
      method: 'POST',
      body: formData
    });
  } catch (error) {
  }
  
  
  return formData;
};

// Alternative approach: Create FormData with all files at once
export const createFormDataWithFiles = (fields: Record<string, any>, files: File[]) => {
  const formData = new FormData();
  
  // Add regular fields
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    }
  });
  
  // Add files - try different approaches
  
  // Approach 1: Multiple appends
  files.forEach((file, index) => {
    formData.append('images', file);
  });
  
  // Verify
  const verifyImages = formData.getAll('images');
  
  
  return formData;
};
