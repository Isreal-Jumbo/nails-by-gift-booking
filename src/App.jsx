import { Navigate, Route, Routes } from "react-router";
import HomePage from "./pages/HomePage.jsx";
import OwnerPage from "./pages/OwnerPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/owner" element={<OwnerPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
