import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import ReservasNueva from "./components/ReservasNueva";
import RackSemanal from "./components/RackSemanal";
import Reportes from "./components/Reportes";
import Register from "./components/Register";


const App = () => {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/reservas"    element={<ReservasNueva />} />
        <Route path="/rack"        element={<RackSemanal />} />
        <Route path="/reportes"    element={<Reportes />} />
        <Route path="/register"    element={<Register />} />
        <Route path="*"            element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
