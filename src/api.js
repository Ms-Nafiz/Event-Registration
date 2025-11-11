import axios from 'axios';

// আপনার লারাভেল ব্যাকএন্ডের অ্যাড্রেস
const API_URL = 'https://9e70b338cfb7.ngrok-free.app';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // কুকি আদান-প্রদানের জন্য এটি অপরিহার্য
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

export default api;