import axios from 'axios';

const API_URL = 'http://localhost:3000/api/courts';
const CHECKIN_URL = 'http://localhost:3000/api/checkins';

// Helper para obtener token (si existe)
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};
};

export const getAllCourts = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error('Error fetching courts:', error);
        throw error;
    }
};

export const getActiveCheckins = async () => {
    try {
        const response = await axios.get(CHECKIN_URL);
        return response.data;
    } catch (error) {
        console.error('Error fetching checkins:', error);
        return [];
    }
};

export const doCheckin = async (courtId, count = 1) => {
    try {
        const config = getAuthHeader();
        // if (!config.headers) throw new Error("No token found"); // Deja que el backend maneje el error 401
        
        const response = await axios.post(CHECKIN_URL, { court_id: courtId, count }, config);
        return response.data;
    } catch (error) {
        console.error('Error doing checkin:', error);
        throw error;
    }
};
