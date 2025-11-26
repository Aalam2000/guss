import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Rounds from "./pages/Rounds";
import Round from "./pages/Round";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/rounds" element={<Rounds />} />
        <Route path="/rounds/:id" element={<Round />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
