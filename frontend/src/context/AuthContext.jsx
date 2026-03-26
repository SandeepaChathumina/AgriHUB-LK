import React, { createContext, useContext, useState } from 'react';

// 1. Create the Context
const AuthContext = createContext();

// 2. Create the Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Holds { id, fullName, role }
  const [token, setToken] = useState(null); // Holds the JWT string

  // Call this function when login is successful
  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
  };

  // Call this function to clear data on logout
  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Create a Custom Hook for easy access in other files
export const useAuth = () => {
  return useContext(AuthContext);
};