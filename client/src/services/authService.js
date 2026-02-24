import axios from "axios";

const API_URL = "http://localhost:3000/api/auth";

export const login = async (email, password) => {
  const res = await axios.post(`${API_URL}/login`, { email, password });
  localStorage.setItem("token", res.data.token);
  return res.data;
};

export const register = async (username, email, password) => {
  const res = await axios.post(`${API_URL}/register`, {
    username,
    email,
    password
  });
  return res.data;
};

export const getCurrentUser = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  return JSON.parse(atob(token.split(".")[1]));
};

export const logout = () => {
  localStorage.removeItem("token");
};