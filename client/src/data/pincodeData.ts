// Indian Pincode to City/State mapping
// This is a sample dataset - in production, you'd use a complete API or database

export const pincodeData: Record<string, { city: string; state: string }> = {
  // Delhi
  "110001": { city: "New Delhi", state: "Delhi" },
  "110002": { city: "New Delhi", state: "Delhi" },
  "110003": { city: "New Delhi", state: "Delhi" },
  "110005": { city: "New Delhi", state: "Delhi" },
  "110006": { city: "New Delhi", state: "Delhi" },
  "110007": { city: "New Delhi", state: "Delhi" },
  "110008": { city: "New Delhi", state: "Delhi" },
  "110009": { city: "New Delhi", state: "Delhi" },
  "110010": { city: "New Delhi", state: "Delhi" },
  "110011": { city: "New Delhi", state: "Delhi" },
  "110012": { city: "New Delhi", state: "Delhi" },
  "110013": { city: "New Delhi", state: "Delhi" },
  "110014": { city: "New Delhi", state: "Delhi" },
  "110015": { city: "New Delhi", state: "Delhi" },
  "110016": { city: "New Delhi", state: "Delhi" },
  "110017": { city: "New Delhi", state: "Delhi" },
  "110018": { city: "New Delhi", state: "Delhi" },
  "110019": { city: "New Delhi", state: "Delhi" },
  "110020": { city: "New Delhi", state: "Delhi" },
  
  // Mumbai
  "400001": { city: "Mumbai", state: "Maharashtra" },
  "400002": { city: "Mumbai", state: "Maharashtra" },
  "400003": { city: "Mumbai", state: "Maharashtra" },
  "400004": { city: "Mumbai", state: "Maharashtra" },
  "400005": { city: "Mumbai", state: "Maharashtra" },
  "400006": { city: "Mumbai", state: "Maharashtra" },
  "400007": { city: "Mumbai", state: "Maharashtra" },
  "400008": { city: "Mumbai", state: "Maharashtra" },
  "400009": { city: "Mumbai", state: "Maharashtra" },
  "400010": { city: "Mumbai", state: "Maharashtra" },
  "400011": { city: "Mumbai", state: "Maharashtra" },
  "400012": { city: "Mumbai", state: "Maharashtra" },
  "400013": { city: "Mumbai", state: "Maharashtra" },
  "400014": { city: "Mumbai", state: "Maharashtra" },
  
  // Bangalore
  "560001": { city: "Bangalore", state: "Karnataka" },
  "560002": { city: "Bangalore", state: "Karnataka" },
  "560003": { city: "Bangalore", state: "Karnataka" },
  "560004": { city: "Bangalore", state: "Karnataka" },
  "560005": { city: "Bangalore", state: "Karnataka" },
  "560006": { city: "Bangalore", state: "Karnataka" },
  "560007": { city: "Bangalore", state: "Karnataka" },
  "560008": { city: "Bangalore", state: "Karnataka" },
  "560009": { city: "Bangalore", state: "Karnataka" },
  "560010": { city: "Bangalore", state: "Karnataka" },
  
  // Chennai
  "600001": { city: "Chennai", state: "Tamil Nadu" },
  "600002": { city: "Chennai", state: "Tamil Nadu" },
  "600003": { city: "Chennai", state: "Tamil Nadu" },
  "600004": { city: "Chennai", state: "Tamil Nadu" },
  "600005": { city: "Chennai", state: "Tamil Nadu" },
  "600006": { city: "Chennai", state: "Tamil Nadu" },
  "600007": { city: "Chennai", state: "Tamil Nadu" },
  "600008": { city: "Chennai", state: "Tamil Nadu" },
  
  // Kolkata
  "700001": { city: "Kolkata", state: "West Bengal" },
  "700002": { city: "Kolkata", state: "West Bengal" },
  "700003": { city: "Kolkata", state: "West Bengal" },
  "700004": { city: "Kolkata", state: "West Bengal" },
  "700005": { city: "Kolkata", state: "West Bengal" },
  "700006": { city: "Kolkata", state: "West Bengal" },
  "700007": { city: "Kolkata", state: "West Bengal" },
  
  // Hyderabad
  "500001": { city: "Hyderabad", state: "Telangana" },
  "500002": { city: "Hyderabad", state: "Telangana" },
  "500003": { city: "Hyderabad", state: "Telangana" },
  "500004": { city: "Hyderabad", state: "Telangana" },
  "500005": { city: "Hyderabad", state: "Telangana" },
  
  // Pune
  "411001": { city: "Pune", state: "Maharashtra" },
  "411002": { city: "Pune", state: "Maharashtra" },
  "411003": { city: "Pune", state: "Maharashtra" },
  "411004": { city: "Pune", state: "Maharashtra" },
  "411005": { city: "Pune", state: "Maharashtra" },
  
  // Ahmedabad
  "380001": { city: "Ahmedabad", state: "Gujarat" },
  "380002": { city: "Ahmedabad", state: "Gujarat" },
  "380003": { city: "Ahmedabad", state: "Gujarat" },
  "380004": { city: "Ahmedabad", state: "Gujarat" },
  "380005": { city: "Ahmedabad", state: "Gujarat" },
  
  // Jaipur
  "302001": { city: "Jaipur", state: "Rajasthan" },
  "302002": { city: "Jaipur", state: "Rajasthan" },
  "302003": { city: "Jaipur", state: "Rajasthan" },
  "302004": { city: "Jaipur", state: "Rajasthan" },
  
  // Lucknow
  "226001": { city: "Lucknow", state: "Uttar Pradesh" },
  "226002": { city: "Lucknow", state: "Uttar Pradesh" },
  "226003": { city: "Lucknow", state: "Uttar Pradesh" },
  
  // Chandigarh
  "160001": { city: "Chandigarh", state: "Chandigarh" },
  "160002": { city: "Chandigarh", state: "Chandigarh" },
  "160003": { city: "Chandigarh", state: "Chandigarh" },
  
  // Add more as needed...
};

// Function to get location from pincode
export const getLocationFromPincode = (pincode: string): { city: string; state: string } | null => {
  return pincodeData[pincode] || null;
};

// Function to guess state from pincode pattern (fallback)
export const guessStateFromPincode = (pincode: string): string => {
  const firstTwo = pincode.substring(0, 2);
  const stateMap: Record<string, string> = {
    "11": "Delhi",
    "12": "Haryana",
    "13": "Punjab",
    "14": "Punjab",
    "15": "Punjab",
    "16": "Chandigarh",
    "17": "Himachal Pradesh",
    "18": "Jammu & Kashmir",
    "19": "Jammu & Kashmir",
    "20": "Uttar Pradesh",
    "21": "Uttar Pradesh",
    "22": "Uttar Pradesh",
    "23": "Uttar Pradesh",
    "24": "Uttar Pradesh",
    "25": "Uttar Pradesh",
    "26": "Uttar Pradesh",
    "27": "Uttar Pradesh",
    "28": "Uttar Pradesh",
    "30": "Rajasthan",
    "31": "Rajasthan",
    "32": "Rajasthan",
    "33": "Rajasthan",
    "34": "Rajasthan",
    "36": "Gujarat",
    "37": "Gujarat",
    "38": "Gujarat",
    "39": "Gujarat",
    "40": "Maharashtra",
    "41": "Maharashtra",
    "42": "Maharashtra",
    "43": "Maharashtra",
    "44": "Maharashtra",
    "45": "Madhya Pradesh",
    "46": "Madhya Pradesh",
    "47": "Madhya Pradesh",
    "48": "Madhya Pradesh",
    "49": "Chhattisgarh",
    "50": "Telangana",
    "51": "Andhra Pradesh",
    "52": "Andhra Pradesh",
    "53": "Andhra Pradesh",
    "56": "Karnataka",
    "57": "Karnataka",
    "58": "Karnataka",
    "59": "Karnataka",
    "60": "Tamil Nadu",
    "61": "Tamil Nadu",
    "62": "Tamil Nadu",
    "63": "Tamil Nadu",
    "64": "Tamil Nadu",
    "67": "Kerala",
    "68": "Kerala",
    "69": "Kerala",
    "70": "West Bengal",
    "71": "West Bengal",
    "72": "West Bengal",
    "73": "West Bengal",
    "74": "West Bengal",
    "75": "Odisha",
    "76": "Odisha",
    "77": "Odisha",
    "78": "Assam",
    "79": "Arunachal Pradesh",
    "80": "Bihar",
    "81": "Bihar",
    "82": "Bihar",
    "83": "Jharkhand",
    "84": "Bihar",
    "85": "Bihar",
  };
  
  return stateMap[firstTwo] || "";
};
