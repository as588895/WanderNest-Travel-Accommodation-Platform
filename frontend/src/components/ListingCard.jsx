import { Heart, MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { listings } from "../services/api";

const placeTints = [
  { match: /goa|beach|coast|island|sea/i, tint: "#fff0e7", accent: "#f97316" },
  { match: /mumbai|city|delhi|new york|london|urban/i, tint: "#eaf2ff", accent: "#3b82f6" },
  { match: /mountain|manali|shimla|himalaya|hill/i, tint: "#eaf8ef", accent: "#16a34a" },
  { match: /jaipur|rajasthan|desert|jaisalmer/i, tint: "#fff2df", accent: "#d97706" },
  { match: /kerala|forest|farm|nature|green/i, tint: "#e9f8f1", accent: "#0f9f78" },
  { match: /snow|arctic|ice|winter/i, tint: "#eaf7ff", accent: "#0284c7" },
];

function getPlaceTheme(item) {
  const place = `${item.location || ""} ${item.country || ""} ${item.category || ""} ${item.title || ""}`;
  return placeTints.find((theme) => theme.match.test(place)) || {
    tint: "#fff0f4",
    accent: "#ff385c",
  };
}

export default function ListingCard({ item, onChange }) {
  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (item.isWishlisted) await listings.remove(item._id);
      else await listings.add(item._id);
      item.isWishlisted = !item.isWishlisted;
      onChange?.();
    } catch (err) {
      alert(err.response?.data?.error || "Please login to use wishlist.");
    }
  };

  const reviews = item.reviews || [];
  const avg = reviews.length
    ? (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1)
    : null;
  const theme = getPlaceTheme(item);

  return (
    <Link to={`/listings/${item._id}`} className="listing-card-link" style={{ textDecoration: "none", color: "inherit" }}>
      <article
        className="listing-card"
        style={{ "--place-tint": theme.tint, "--place-accent": theme.accent }}
      >
        <div className="image-wrap">
          <img
            className="listing-img"
            src={item.image?.url || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80"}
            alt={item.title || "WanderNest stay"}
            loading="lazy"
          />
          <button
            type="button"
            aria-label={item.isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className={`heart ${item.isWishlisted ? "active" : ""}`}
            onClick={toggle}
          >
            <Heart size={19} fill={item.isWishlisted ? "currentColor" : "none"} />
          </button>
          {item.category && <span className="image-tag">{item.category}</span>}
        </div>
        <div className="listing-body">
          <div className="listing-title-row">
            <div className="listing-title">{item.title}</div>
            {avg && <span className="rating-mini"><Star size={13} fill="currentColor" /> {avg}</span>}
          </div>
          <div className="listing-location"><MapPin size={14} /> {item.location}, {item.country}</div>
          <div className="price">₹{Number(item.price || 0).toLocaleString("en-IN")} <span className="muted">/ night</span></div>
        </div>
      </article>
    </Link>
  );
}
