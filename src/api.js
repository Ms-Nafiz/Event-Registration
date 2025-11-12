import axios from "axios";
import Cookies from "js-cookie";

// আপনার লারাভেল ব্যাকএন্ডের অ্যাড্রেস
const API_URL = "https://event.cclcatv.com";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // কুকি আদান-প্রদানের জন্য এটি অপরিহার্য
  withXSRFToken: true,
});

// api.defaults.xsrfCookieName = 'XSRF-TOKEN';
// api.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';
// CSRF token এর জন্য request interceptor
api.interceptors.request.use(async (config) => {
  // প্রথমে CSRF cookie নিশ্চিত করুন
  await axios.get('https://event.cclcatv.com/sanctum/csrf-cookie', {
    withCredentials: true
  });
  return config;
});
export default api;
