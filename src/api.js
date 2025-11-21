import axios from "axios";
import Cookies from "js-cookie";

// API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "https://event.cclcatv.com";

const api = axios.create({
  baseURL: API_URL,
  // withCredentials: true, // কুকি আদান-প্রদানের জন্য এটি অপরিহার্য
  // withXSRFToken: true,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
  },
});

api.defaults.withCredentials = true;
api.defaults.withXSRFToken = true;
api.defaults.xsrfCookieName = "XSRF-TOKEN";
api.defaults.xsrfHeaderName = "X-XSRF-TOKEN";
// Automatically add X-XSRF-TOKEN from cookie
// axios.interceptors.request.use((config) => {
//     const cookies = document.cookie.split(';');
//     const xsrfToken = cookies
//         .find(cookie => cookie.trim().startsWith('XSRF-TOKEN='))
//         ?.split('=')[1];

//     if (xsrfToken) {
//         config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
//     }

//     return config;
// });

export default api;
