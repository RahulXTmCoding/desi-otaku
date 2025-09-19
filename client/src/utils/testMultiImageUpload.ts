// Test script to verify multi-image upload functionality

export const testMultiImageUpload = () => {
  
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
  formData.append("images", file1);
  formData.append("images", file2);
  formData.append("images", file3);
  
  // Check what's in FormData
  let imageCount = 0;
  for (let [key, value] of formData.entries()) {
    if (key === "images") {
      imageCount++;
    } else {
    }
  }
  
  
  // Alternative: Get all values for 'images' key
  const allImages = formData.getAll("images");
  allImages.forEach((img, idx) => {
  });
  
  
  return formData;
};
