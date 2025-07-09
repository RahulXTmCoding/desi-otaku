// Debug utility to inspect FormData before sending

export const debugFormData = (formData: FormData) => {
  console.log("\n=== FormData Debug Utility ===");
  
  // Method 1: Using entries()
  console.log("\n1. Using entries():");
  let entriesCount = 0;
  for (let [key, value] of formData.entries()) {
    entriesCount++;
    if (value instanceof File) {
      console.log(`  [${entriesCount}] ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
    } else {
      console.log(`  [${entriesCount}] ${key}: ${value}`);
    }
  }
  
  // Method 2: Using getAll() for 'images'
  console.log("\n2. Using getAll('images'):");
  const allImages = formData.getAll('images');
  console.log(`  Total images: ${allImages.length}`);
  allImages.forEach((img, idx) => {
    if (img instanceof File) {
      console.log(`  [${idx}] File(${img.name}, ${img.size} bytes, ${img.type})`);
    } else {
      console.log(`  [${idx}] ${img}`);
    }
  });
  
  // Method 3: Check if FormData has the files
  console.log("\n3. FormData.has() checks:");
  console.log(`  has('images'): ${formData.has('images')}`);
  console.log(`  has('name'): ${formData.has('name')}`);
  console.log(`  has('description'): ${formData.has('description')}`);
  
  // Method 4: Create a test request to see what would be sent
  console.log("\n4. Creating test Request object:");
  try {
    const testRequest = new Request('http://test.com', {
      method: 'POST',
      body: formData
    });
    console.log("  Request created successfully");
    console.log("  Request headers:", testRequest.headers);
  } catch (error) {
    console.log("  Error creating request:", error);
  }
  
  console.log("\n=== End Debug ===\n");
  
  return formData;
};

// Alternative approach: Create FormData with all files at once
export const createFormDataWithFiles = (fields: Record<string, any>, files: File[]) => {
  console.log("\n=== Creating FormData with Files ===");
  const formData = new FormData();
  
  // Add regular fields
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    }
  });
  
  // Add files - try different approaches
  console.log(`Adding ${files.length} files to FormData...`);
  
  // Approach 1: Multiple appends
  files.forEach((file, index) => {
    console.log(`  Appending file ${index + 1}: ${file.name}`);
    formData.append('images', file);
  });
  
  // Verify
  const verifyImages = formData.getAll('images');
  console.log(`Verification: FormData contains ${verifyImages.length} images`);
  
  console.log("=== FormData Created ===\n");
  
  return formData;
};
