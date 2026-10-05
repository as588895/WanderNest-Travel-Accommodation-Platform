import {
  ArrowRight,
  Compass,
  ShieldCheck,
  Sparkles,
  Heart,
  Search,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import ListingCard from "../components/ListingCard";
const cats = [
  "Trending",
  "Iconic Cities",
  "Mountains",
  "Amazing Pools",
  "Camping",
  "Farms",
  "Arctic",
];
export default function Home({ items = [] }) {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">
              <Sparkles size={14} /> Smart stays. Better journeys.
            </span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Stay somewhere <span>you’ll love.</span>
            </motion.h1>
            <p>
              WanderNest combines curated stays, smart discovery, secure
              Razorpay booking, wishlist and post-stay Reality Check feedback in
              one experience.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/listings">
                Explore stays <ArrowRight size={18} />
              </Link>
              <Link className="btn btn-light" to="/signup">
                Join WanderNest
              </Link>
            </div>
            <div className="trust-row">
              <span>
                <Compass size={17} /> Curated stays
              </span>
              <span>
                <ShieldCheck size={17} /> Secure payments
              </span>
              <span>
                <Heart size={17} /> Save favourites
              </span>
            </div>
          </div>
          <motion.div
            className="hero-card"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <img
              src={
                items[0]?.image?.url ||
                "https://images.unsplash.com/photo-1601918774946-25832a4be0d6?auto=format&fit=crop&w=1100&q=85"
              }
            />
            <div className="hero-floating">
              <Star fill="currentColor" size={15} /> Handpicked destination
            </div>
          </motion.div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">EXPLORE</span>
              <h2>Find your kind of stay</h2>
              <p className="muted">
                Search by destination or browse a category.
              </p>
            </div>
            <Link className="small-link" to="/listings">
              View all →
            </Link>
          </div>
          <div className="category-strip">
            {cats.map((c) => (
              <Link
                key={c}
                to={"/listings?category=" + encodeURIComponent(c)}
                className="category-pill"
              >
                {c}
              </Link>
            ))}
          </div>
          {items.length ? (
            <div className="grid">
              {items.slice(0, 8).map((x) => (
                <ListingCard key={x._id} item={x} />
              ))}
            </div>
          ) : (
            
<div className="empty">
  <div className="empty-icon">
    <i className="fa-solid fa-magnifying-glass"></i>
  </div>

  <h3>Finding Your Perfect Stay</h3>

  <p>
    We're getting your next adventure ready!
    Our stays are being loaded, so please check back in a moment.
  </p>

  <span className="loading-status">
    <span className="loading-dot"></span>
    Connecting to available stays...
  </span>
</div>
          )}
        </div>
      </section>
      <section className="feature-band">
        <div className="container feature-grid">
          <div>
            <span className="eyebrow">WHY WANDERNEST</span>
            <h2>Everything you need before, during and after a stay.</h2>
          </div>
          <div className="feature-list">
            <div>
              <ShieldCheck />
              <b>Secure booking</b>
              <span>Razorpay order creation + signature verification.</span>
            </div>
            <div>
              <Sparkles />
              <b>AI-assisted discovery</b>
              <span>
                Ask for a destination or budget and get matching properties.
              </span>
            </div>
            <div>
              <Heart />
              <b>One-click wishlist</b>
              <span>Keep your favourite stays ready for later.</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
