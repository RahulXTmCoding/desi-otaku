import { API } from "../../backend";

// Update user profile
export const updateUserProfile = async (
  userId: string,
  token: string,
  profileData: {
    name?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
  }
) => {
  try {
    const response = await fetch(`${API}/user/update/${userId}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });
    
    const data = await response.json();
    
    if (data.error) {
      return { error: data.error };
    }
    
    // Update localStorage with new user data
    const authData = JSON.parse(localStorage.getItem("jwt") || "{}");
    if (authData && authData.user) {
      authData.user = { ...authData.user, ...profileData };
      localStorage.setItem("jwt", JSON.stringify(authData));
    }
    
    return data;
  } catch (err) {
    console.error("Error updating profile:", err);
    return { error: "Failed to update profile" };
  }
};

// Change password
export const changePassword = async (
  userId: string,
  token: string,
  currentPassword: string,
  newPassword: string
) => {
  try {
    const response = await fetch(`${API}/user/changepassword/${userId}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      return { error: data.error };
    }
    
    return data;
  } catch (err) {
    console.error("Error changing password:", err);
    return { error: "Failed to change password" };
  }
};

// Get user details
export const getUserDetails = async (userId: string, token: string) => {
  try {
    const response = await fetch(`${API}/user/${userId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.error) {
      return { error: data.error };
    }
    
    return data;
  } catch (err) {
    console.error("Error fetching user details:", err);
    return { error: "Failed to fetch user details" };
  }
};

// Update user preferences
export const updateUserPreferences = async (
  userId: string,
  token: string,
  preferences: {
    newsletter?: boolean;
    smsNotifications?: boolean;
    emailNotifications?: boolean;
    language?: string;
    currency?: string;
  }
) => {
  try {
    const response = await fetch(`${API}/user/preferences/${userId}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(preferences)
    });
    
    const data = await response.json();
    
    if (data.error) {
      return { error: data.error };
    }
    
    return data;
  } catch (err) {
    console.error("Error updating preferences:", err);
    return { error: "Failed to update preferences" };
  }
};
