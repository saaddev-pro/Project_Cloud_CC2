import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { authAPI } from '../api/users';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Add registration function
  const register = async (userData) => {
    try {
      // Use authAPI instead of direct axios call
      const response = await authAPI.register(userData);
      const { token } = response.data;
  
      if (!token) throw new Error('Invalid token received');
  
      // Verify token structure
      try {
        jwtDecode(token);
      } catch (decodeError) {
        throw new Error('Invalid token structure');
      }
  
      // Get user details using the API client
      const decoded = jwtDecode(token);
      const userResponse = await authAPI.getProfile(decoded.userId);
  
      // Update state and storage
      setUser(userResponse.data);
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  
      return response.data;
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  // Enhanced login with token verification
  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { token } = response.data;
      
      const decoded = jwtDecode(token);
      const userResponse = await authAPI.getProfile(decoded.userId);
      
      localStorage.setItem('token', token);
      setUser(userResponse.data);
      return userResponse.data;
    } catch (error) {
      console.error('Login error:', error.message);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const decoded = jwtDecode(token);
      const userResponse = await authAPI.getProfile(decoded.userId);
      setUser(userResponse.data);
    } catch (error) {
      console.error('Refresh error:', error);
    }
  };


  // Enhanced logout
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    window.location.reload(); // Ensure clean state
  };

  // Auto-login with token verification
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const decoded = jwtDecode(token);
        if (Date.now() >= decoded.exp * 1000) {
          throw new Error('Token expired');
        }

        const userResponse = await authAPI.getProfile(decoded.userId);
        setUser(userResponse.data);
      } catch (error) {
        console.error('Session validation failed:', error.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);


  const value = {
    user,
    login,
    logout,
    register ,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);