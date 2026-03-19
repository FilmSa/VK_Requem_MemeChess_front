import { BrowserRouter, Routes, Route } from "react-router-dom";
import PlayPage from "../pages/PlayPage";
import ShopPage from "../pages/ShopPage";
import ProfilePage from "../pages/ProfilePage";
import TournamentsPage from "../pages/TournamentsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PlayPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/tournaments" element={<TournamentsPage />} />
      </Routes>
    </BrowserRouter>
  );
}