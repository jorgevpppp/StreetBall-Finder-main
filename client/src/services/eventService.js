import axios from "axios";

const API_URL = "http://localhost:3000/api/events";

// Obtener todos los eventos
export const getAllEvents = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

// Crear evento
export const createEvent = async (data) => {
  const token = localStorage.getItem("token");

  const res = await axios.post(API_URL, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};

// Unirse a evento
export const joinEvent = async (eventId, count = 1) => {
  const token = localStorage.getItem("token");

  const res = await axios.post(
    `${API_URL}/${eventId}/join`,
    { count },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
};

// Salir de evento
export const leaveEvent = async (eventId) => {
  const token = localStorage.getItem("token");

  const res = await axios.post(
    `${API_URL}/${eventId}/leave`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
};

// Eliminar evento
export const deleteEvent = async (eventId) => {
  const token = localStorage.getItem("token");

  const res = await axios.delete(`${API_URL}/${eventId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};