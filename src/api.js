import axios from "axios";
import Cookies from "js-cookie";

// আপনার লারাভেল ব্যাকএন্ডের অ্যাড্রেস
const API_URL = "https://event.cclcatv.com";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // কুকি আদান-প্রদানের জন্য এটি অপরিহার্য
  withXSRFToken: true,
});

api.defaults.xsrfCookieName = 'XSRF-TOKEN';
api.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';
// Interceptor — প্রতিটি request এর আগে XSRF token header এ বসানো হবে
// api.interceptors.request.use((config) => {
//   const token = Cookies.get("XSRF-TOKEN");
//   if (token) {
//     config.headers["X-XSRF-TOKEN"] = decodeURIComponent(token);
//   }
//   return config;
// });
export default api;
