// src/services/api.js
import { API_URL } from "../cognitoConfig";

async function request(method, path, body, getIdToken) {
  const token = await getIdToken();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

// Tasks
export const getTasks      = (getIdToken) => request("GET",  "/tasks",             null, getIdToken);
export const getTaskById   = (id, getIdToken) => request("GET",  `/tasks/${id}`,  null, getIdToken);
export const createTask    = (body, getIdToken) => request("POST", "/tasks",       body, getIdToken);
export const updateTask    = (id, body, getIdToken) => request("PUT", `/tasks/${id}`, body, getIdToken);
export const assignTask    = (id, body, getIdToken) => request("POST", `/tasks/${id}/assign`, body, getIdToken);
export const closeTask     = (id, getIdToken) => request("POST", `/tasks/${id}/close`, {}, getIdToken);

// Users
export const getUsers = (getIdToken) => request("GET", "/users", null, getIdToken);
