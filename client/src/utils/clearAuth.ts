// Utility to clear bad authentication data
export const clearBadAuthData = () => {
  const jwt = localStorage.getItem('jwt');
  
  if (jwt) {
    try {
      const parsed = JSON.parse(jwt);
      
      // Check if it's mock data that shouldn't be there
      if (parsed.user && parsed.user._id && parsed.user._id.includes('mock')) {
        console.log('Clearing mock authentication data');
        localStorage.removeItem('jwt');
        return true;
      }
    } catch (e) {
      console.log('Invalid JWT in localStorage, clearing');
      localStorage.removeItem('jwt');
      return true;
    }
  }
  
  return false;
};

// Call this function on app startup
export const initializeAuth = () => {
  if (clearBadAuthData()) {
    console.log('Bad auth data cleared, please reload the page');
    // Optionally reload
    // window.location.reload();
  }
};
