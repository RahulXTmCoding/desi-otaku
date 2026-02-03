// Email validation
export const validateEmail = (
  email: string
): { isValid: boolean; error?: string } => {
  if (!email) {
    return { isValid: false, error: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }

  return { isValid: true };
};

// Phone validation (Indian phone numbers)
export const validatePhone = (
  phone: string
): { isValid: boolean; error?: string; cleanPhone?: string } => {
  if (!phone) {
    return { isValid: false, error: "Phone number is required" };
  }

  // Remove spaces, dashes, parentheses, and plus sign
  let cleanPhone = phone.replace(/[\s\-\(\)\+]/g, "");
  
  // Remove country code prefix (91 or 0)
  if (cleanPhone.startsWith('91') && cleanPhone.length > 10) {
    cleanPhone = cleanPhone.substring(2);
  } else if (cleanPhone.startsWith('0') && cleanPhone.length > 10) {
    cleanPhone = cleanPhone.substring(1);
  }

  // Check length
  if (cleanPhone.length < 10) {
    const remaining = 10 - cleanPhone.length;
    return {
      isValid: false,
      error: `Phone number too short. Need ${remaining} more digit${remaining > 1 ? 's' : ''} (${cleanPhone.length}/10)`,
      cleanPhone
    };
  }
  
  if (cleanPhone.length > 10) {
    return {
      isValid: false,
      error: `Phone number too long. Enter only 10 digits without country code`,
      cleanPhone
    };
  }

  // Indian phone numbers must start with 6-9
  if (!/^[6-9]/.test(cleanPhone)) {
    return {
      isValid: false,
      error: "Indian phone numbers must start with 6, 7, 8, or 9",
      cleanPhone
    };
  }
  
  // Must be all digits
  if (!/^\d{10}$/.test(cleanPhone)) {
    return {
      isValid: false,
      error: "Phone number should contain only digits",
      cleanPhone
    };
  }

  return { isValid: true, cleanPhone };
};

// Utility to clean phone number (strips country code and formatting)
export const cleanPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Remove country code prefix
  if (cleaned.startsWith('91') && cleaned.length > 10) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0') && cleaned.length > 10) {
    cleaned = cleaned.substring(1);
  }
  
  return cleaned;
};

// Name validation
export const validateName = (
  name: string
): { isValid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: "Name is required" };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: "Name must be at least 2 characters long" };
  }

  if (!/^[a-zA-Z\s]+$/.test(name)) {
    return {
      isValid: false,
      error: "Name should only contain letters and spaces",
    };
  }

  return { isValid: true };
};

// Password validation
export const validatePassword = (
  password: string
): { isValid: boolean; error?: string } => {
  if (!password) {
    return { isValid: false, error: "Password is required" };
  }

  if (password.length < 6) {
    return {
      isValid: false,
      error: "Password must be at least 6 characters long",
    };
  }

  // Check for at least one number and one letter
  if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one letter and one number",
    };
  }

  return { isValid: true };
};

// Confirm password validation
export const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): { isValid: boolean; error?: string } => {
  if (!confirmPassword) {
    return { isValid: false, error: "Please confirm your password" };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: "Passwords do not match" };
  }

  return { isValid: true };
};

// PIN code validation (Indian PIN codes)
export const validatePinCode = (
  pinCode: string
): { isValid: boolean; error?: string } => {
  if (!pinCode) {
    return { isValid: false, error: "PIN code is required" };
  }

  // Remove any spaces or dashes
  const cleaned = pinCode.replace(/[\s-]/g, "");

  if (!/^\d+$/.test(cleaned)) {
    return { isValid: false, error: "PIN code must contain only numbers" };
  }

  if (cleaned.length < 6) {
    return {
      isValid: false,
      error: `Enter ${6 - cleaned.length} more digit${
        6 - cleaned.length > 1 ? "s" : ""
      }`,
    };
  }

  if (cleaned.length > 6) {
    return { isValid: false, error: "PIN code must be exactly 6 digits" };
  }

  // First digit should be 1-9
  if (cleaned[0] === "0") {
    return {
      isValid: false,
      error: "Invalid PIN code - first digit cannot be 0",
    };
  }

  return { isValid: true };
};

// Format pincode by removing non-digits
export const formatPinCode = (pinCode: string): string => {
  return pinCode.replace(/\D/g, "").slice(0, 6);
};

// Address validation
export const validateAddress = (
  address: string
): { isValid: boolean; error?: string } => {
  if (!address || address.trim().length === 0) {
    return { isValid: false, error: "Address is required" };
  }

  if (address.trim().length < 10) {
    return { isValid: false, error: "Please enter a complete address" };
  }

  return { isValid: true };
};

// City validation
export const validateCity = (
  city: string
): { isValid: boolean; error?: string } => {
  if (!city || city.trim().length === 0) {
    return { isValid: false, error: "City is required" };
  }

  if (!/^[a-zA-Z\s]+$/.test(city)) {
    return {
      isValid: false,
      error: "City name should only contain letters and spaces",
    };
  }

  return { isValid: true };
};

// State validation
export const validateState = (
  state: string
): { isValid: boolean; error?: string } => {
  if (!state || state.trim().length === 0) {
    return { isValid: false, error: "State is required" };
  }

  if (!/^[a-zA-Z\s]+$/.test(state)) {
    return {
      isValid: false,
      error: "State name should only contain letters and spaces",
    };
  }

  return { isValid: true };
};

// Complete address form validation
export const validateAddressForm = (addressData: {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  const nameValidation = validateName(addressData.fullName);
  if (!nameValidation.isValid) errors.fullName = nameValidation.error!;

  const emailValidation = validateEmail(addressData.email);
  if (!emailValidation.isValid) errors.email = emailValidation.error!;

  const phoneValidation = validatePhone(addressData.phone);
  if (!phoneValidation.isValid) errors.phone = phoneValidation.error!;

  const addressValidation = validateAddress(addressData.address);
  if (!addressValidation.isValid) errors.address = addressValidation.error!;

  const cityValidation = validateCity(addressData.city);
  if (!cityValidation.isValid) errors.city = cityValidation.error!;

  const stateValidation = validateState(addressData.state);
  if (!stateValidation.isValid) errors.state = stateValidation.error!;

  const pinCodeValidation = validatePinCode(addressData.pinCode);
  if (!pinCodeValidation.isValid) errors.pinCode = pinCodeValidation.error!;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Format phone number for display
export const formatPhoneNumber = (phone: string): string => {
  const cleanPhone = phone.replace(/[\s-+]/g, "").replace(/^91/, "");
  if (cleanPhone.length === 10) {
    return `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`;
  }
  return phone;
};
