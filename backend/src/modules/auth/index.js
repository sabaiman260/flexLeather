import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000/api/v1", // Adjust to your backend URL
    withCredentials: true, // Important for sending cookies (like refresh token)
});

api.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem("accessToken");
        if (accessToken) {
            config.headers["Authorization"] = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;