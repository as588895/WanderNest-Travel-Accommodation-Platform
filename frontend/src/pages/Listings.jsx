import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import ListingCard from "../components/ListingCard";
import { listings } from "../services/api";
const cats = [
  "All",
  "Trending",
  "Rooms",
  "Iconic Cities",
  "Mountains",
  "Castles",
  "Amazing Pools",
  "Camping",
  "Farms",
  "Arctic",
];
export default function Listings() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(params.get("search") || "");
  const search = params.get("search") || "";
  const category = params.get("category") || "";
  const load = () => {
    setLoading(true);
    listings
      .all({ search, category })
      .then((r) => setItems(r.data.listings))
      .catch((err) => {
        console.error("Listings API Error:", err);
        setItems([]);
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, [search, category]);
  const submit = (e) => {
    e.preventDefault();
    const p = new URLSearchParams(params);
    q.trim() ? p.set("search", q.trim()) : p.delete("search");
    setParams(p);
  };
  return (
    <section className="section">
      <div className="container">
        <div className="listing-toolbar">
          <div>
            <span className="eyebrow">
              <SlidersHorizontal size={14} /> DISCOVER
            </span>
            <h2>{category || "Explore stays"}</h2>
            <p className="muted">
              {search
                ? `Results for “${search}”`
                : "Beautiful places for your next adventure."}
            </p>
          </div>
          <form className="inline-search" onSubmit={submit}>
            <Search size={17} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Try Goa, Delhi, mountains..."
            />
            <button>Search</button>
          </form>
        </div>
        <div className="filters">
          {cats.map((c) => (
            <button
              className={
                "chip " +
                ((c === "All" && !category) || c === category ? "active" : "")
              }
              key={c}
              onClick={() => {
                const n = new URLSearchParams(params);
                c === "All" ? n.delete("category") : n.set("category", c);
                setParams(n);
              }}
            >
              {c}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="empty">
            <div className="loader" />
            Loading WanderNest stays...
          </div>
        ) : items.length ? (
          <div className="grid">
            {items.map((x) => (
              <ListingCard key={x._id} item={x} onChange={load} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <h3>No stays found</h3>
            <p>Try a different destination or category.</p>
          </div>
        )}
      </div>
    </section>
  );
}
