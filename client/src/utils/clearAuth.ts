// Utility to clear bad authentication data
export const clearBadAuthData = () => {
  const jwt = localStorage.getItem('jwt');
  
  if (jwt) {
    try {
      const parsed = JSON.parse(jwt);
      
      // Check if it's mock data that shouldn't be there
      if (parsed.user && parsed.user._id && parsed.user._id.includes('mock')) {
        localStorage.removeItem('jwt');
        return true;
      }
    } catch (e) {
      localStorage.removeItem('jwt');
      return true;
    }
  }
  
  return false;
};

// Call this function on app startup
export const initializeAuth = () => {
  if (clearBadAuthData()) {
    // Optionally reload
    // window.location.reload();
  }
};
