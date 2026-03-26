import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Create the Context
const AuthContext = createContext();

// 2. Create the Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Holds { id, fullName, role }
  const [token, setToken] = useState(null); // Holds the JWT string
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Rehydrate auth state on load so refreshes keep the session
  useEffect(() => {
    const storedUser = localStorage.getItem('authUser');
    const storedToken = localStorage.getItem('authToken');

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (err) {
        localStorage.removeItem('authUser');
        localStorage.removeItem('authToken');
      }
    }
    setIsAuthReady(true);
  }, []);

  // Call this function when login is successful
  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('authUser', JSON.stringify(userData));
    localStorage.setItem('authToken', authToken);
    setIsAuthReady(true);
  };

  // Call this function to clear data on logout
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
    setIsAuthReady(true);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Create a Custom Hook for easy access in other files
export const useAuth = () => {
  return useContext(AuthContext);
};