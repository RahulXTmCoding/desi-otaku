// Test script to verify multi-image upload functionality

export const testMultiImageUpload = () => {
  console.log("=== Testing Multi-Image Upload ===");
  
  // Create a test FormData
  const formData = new FormData();
  
  // Add basic fields
  formData.set("name", "Test Product");
  formData.set("description", "Test Description");
  formData.set("price", "100");
  
  // Create 3 test files
  const file1 = new File(["test1"], "test1.jpg", { type: "image/jpeg" });
  const file2 = new File(["test2"], "test2.jpg", { type: "image/jpeg" });
  const file3 = new File(["test3"], "test3.jpg", { type: "image/jpeg" });
  
  // Append files to FormData
  console.log("Appending file 1:", file1.name);
  formData.append("images", file1);
  console.log("Appending file 2:", file2.name);
  formData.append("images", file2);
  console.log("Appending file 3:", file3.name);
  formData.append("images", file3);
  
  // Check what's in FormData
  console.log("\nChecking FormData contents:");
  let imageCount = 0;
  for (let [key, value] of formData.entries()) {
    if (key === "images") {
      imageCount++;
      console.log(`  ${key}[${imageCount}]:`, value instanceof File ? value.name : value);
    } else {
      console.log(`  ${key}:`, value);
    }
  }
  
  console.log(`\nTotal images in FormData: ${imageCount}`);
  
  // Alternative: Get all values for 'images' key
  const allImages = formData.getAll("images");
  console.log("\nUsing getAll('images'):", allImages.length, "files");
  allImages.forEach((img, idx) => {
    console.log(`  [${idx}]:`, img instanceof File ? img.name : img);
  });
  
  console.log("=== Test Complete ===");
  
  return formData;
};
