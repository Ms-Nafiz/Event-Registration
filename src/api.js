import axios from "axios";
import ky from "ky";
import Cookies from "js-cookie";

// আপনার লারাভেল ব্যাকএন্ডের অ্যাড্রেস
const API_URL = /*"http://localhost:8000";*/"https://event.cclcatv.com";

const api = ky.create({
  baseURL: API_URL,
  withCredentials: true, // কুকি আদান-প্রদানের জন্য এটি অপরিহার্য
  credentials: 'include',
  // withXSRFToken: true,
  // headers: {
  //   "X-Requested-With": "XMLHttpRequest",
  // },
});

// api.defaults.xsrfCookieName = 'XSRF-TOKEN';
// api.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';
// api.interceptors.request.use(
//   (config) => {
//     const token = Cookies.get("XSRF-TOKEN");
//     if (token) {
//       config.headers["X-XSRF-TOKEN"] = token;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

export default api;
