
import axios from 'axios';


const backendHost = import.meta.env.VITE_KARTING_BACKEND_HOST;   
const backendPort = import.meta.env.VITE_KARTING_BACKEND_PORT;   


export default axios.create({
  baseURL: `http://${backendHost}:${backendPort}`,  
  headers: {
    'Content-Type': 'application/json',
  },
});
