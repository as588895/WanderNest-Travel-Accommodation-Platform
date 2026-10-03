import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import AIAssistant from "./components/AIAssistant";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Listings from "./pages/Listings";
import ListingDetails from "./pages/ListingDetails";
import Auth from "./pages/Auth";
import Wishlist from "./pages/Wishlist";
import Orders from "./pages/Orders";
import ListingForm from "./pages/ListingForm";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import BookingSuccess from "./pages/BookingSuccess";
import RealityCheck from "./pages/RealityCheck";
import Profile from "./pages/Profile";
import { auth, listings } from "./services/api";
import "./styles.css";
function Shell() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [toast, setToast] = useState("");
  useEffect(() => {
    auth
      .me()
      .then((r) => setUser(r.data.user))
      .catch(() => {});
    listings
      .all()
      .then((r) => setItems(r.data.listings))
      .catch(() => {});
  }, []);
  const notify = (m) => {
    setToast(m);
    setTimeout(() => setToast(""), 3000);
  };
  return (
    <div className="app">
      <Navbar user={user} setUser={setUser} notify={notify} />
      <Routes>
        <Route path="/" element={<Home items={items} />} />
        <Route path="/listings" element={<Listings />} />
        <Route
          path="/listings/:id"
          element={<ListingDetails user={user} notify={notify} />}
        />
        <Route
          path="/listings/new"
          element={
            user ? (
              <ListingForm mode="create" notify={notify} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/listings/:id/edit"
          element={
            user ? (
              <ListingForm mode="edit" notify={notify} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/login"
          element={<Auth mode="login" onLogin={setUser} />}
        />
        <Route
          path="/signup"
          element={<Auth mode="signup" onLogin={setUser} />}
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/bookings/:id/success" element={<BookingSuccess />} />
        <Route
          path="/bookings/:id/reality-check-feedback"
          element={<RealityCheck />}
        />
        <Route
          path="/profile"
          element={
            user ? (
              <Profile user={user} setUser={setUser} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Footer />
      {toast && <div className="toast">✓ {toast}</div>}
      <AIAssistant />
    </div>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
