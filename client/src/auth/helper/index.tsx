import { API } from "../../backend";

interface User {
  name?: string;
  email: string;
  password: string;
  role?: number;
}

interface AuthResponse {
  token?: string;
  expiryTime?: number; // JWT expiry timestamp
  user?: {
    _id: string;
    name: string;
    email: string;
    role: number;
    phone?: string;
    dob?: string;
  };
  error?: string;
}

export const signup = (user: User): Promise<AuthResponse> => {
  return fetch(`${API}/signup`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(user)
  })
    .then(response => {
      return response.json();
    })
    .catch(err => {
      return { error: "Failed to connect to server" };
    });
};

export const signin = (user: User): Promise<AuthResponse> => {
  return fetch(`${API}/signin`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(user)
  })
    .then(response => {
      return response.json();
    })
    .catch(err => {
      return { error: "Failed to connect to server" };
    });
};

export const authenticate = (data: AuthResponse, next: () => void) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("jwt", JSON.stringify(data));
    next();
  }
};

export const signout = (next: () => void) => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("jwt");
    localStorage.removeItem("cart");
    next();

    return fetch(`${API}/signout`, {
      method: "GET"
    })
  }
};

export const isAutheticated = (): AuthResponse | false => {
  if (typeof window == "undefined") {
    return false;
  }
  
  const jwt = localStorage.getItem("jwt");
  if (!jwt) {
    return false;
  }
  
  try {
    const authData = JSON.parse(jwt);
    
    // Check if token has expired
    if (authData.expiryTime && Date.now() > authData.expiryTime) {
      // Token expired - clean up localStorage and return false
      console.log("JWT token has expired, logging out user");
      localStorage.removeItem("jwt");
      localStorage.removeItem("cart");
      return false;
    }
    
    // Token is still valid
    return authData;
  } catch (error) {
    // Invalid JWT data in localStorage - clean up
    console.error("Invalid JWT data in localStorage:", error);
    localStorage.removeItem("jwt");
    localStorage.removeItem("cart");
    return false;
  }
};

export const socialLogin = (provider: 'google' | 'facebook', response: any): Promise<AuthResponse> => {
  return fetch(`${API}/auth/${provider}/callback`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(response)
  })
    .then(response => {
      return response.json();
    })
    .catch(err => {
      return { error: "Failed to connect to server" };
    });
};

// Mock authentication for test mode
export const mockSignin = (email: string, password: string): AuthResponse => {
  // Calculate 2-week expiry for mock tokens
  const expiryTime = Date.now() + (14 * 24 * 60 * 60 * 1000);
  
  // Mock admin user
  if (email === "admin@example.com" && password === "admin123") {
    return {
      token: "mock-admin-token",
      expiryTime,
      user: {
        _id: "mock-admin-id",
        name: "Admin User",
        email: "admin@example.com",
        role: 1 // Admin role
      }
    };
  }
  
  // Mock regular user
  if (password === "password123") {
    return {
      token: "mock-user-token",
      expiryTime,
      user: {
        _id: "mock-user-id",
        name: email.split('@')[0],
        email: email,
        role: 0 // Regular user role
      }
    };
  }
  
  return {
    error: "Invalid email or password"
  };
};

export const mockSignup = (name: string, email: string, password: string): AuthResponse => {
  // Simple validation
  if (!name || !email || !password) {
    return {
      error: "All fields are required"
    };
  }
  
  if (password.length < 6) {
    return {
      error: "Password must be at least 6 characters"
    };
  }
  
  // Calculate 2-week expiry for mock tokens
  const expiryTime = Date.now() + (14 * 24 * 60 * 60 * 1000);
  
  // Mock successful signup
  return {
    token: "mock-user-token",
    expiryTime,
    user: {
      _id: "mock-new-user-id",
      name: name,
      email: email,
      role: 0 // Regular user role
    }
  };
};
