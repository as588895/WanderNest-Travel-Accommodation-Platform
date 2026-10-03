import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Heart,
  MapPin,
  Star,
  Edit3,
  Trash2,
  ShieldCheck,
  CalendarDays,
  Users,
  Navigation,
} from "lucide-react";
import { listings, reviews, booking, feedback } from "../services/api";
function nights(a, b) {
  if (!a || !b) return 0;
  return Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000));
}
export default function ListingDetails({ user, notify }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [realityFeedback, setRealityFeedback] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [mapRefresh, setMapRefresh] = useState(0);
  const [form, setForm] = useState({ checkIn: "", checkOut: "", guests: 1 });
  const [review, setReview] = useState({ rating: 5, comment: "" });
  const [busy, setBusy] = useState(false);
  const load = async () => {
    try {
      const [listingResponse, feedbackResponse] = await Promise.all([
        listings.one(id),
        feedback.listing(id),
      ]);

      setData(listingResponse.data);

      setRealityFeedback(feedbackResponse.data.feedback || []);
    } catch (error) {
      console.error("Failed to load listing:", error);

      // Listing load fail hone par page error state
      setData({ error: true });

      // Feedback fail ho to empty rakho
      setRealityFeedback([]);
    } finally {
      setFeedbackLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [id]);
  const n = nights(form.checkIn, form.checkOut);
  const subtotal = n * Number(data?.listing?.price || 0);
  const tax = Math.round(subtotal * 0.18);
  const discount = n >= 5 ? Math.round(subtotal * 0.1) : 0;
  const total = Math.max(0, subtotal + tax - discount);
  const minDate = new Date().toISOString().slice(0, 10);
  if (!data) return <div className="empty">Loading property...</div>;
  if (data.error)
    return (
      <div className="empty">
        <h3>Listing not found</h3>
        <Link to="/listings" className="btn btn-primary">
          Back to stays
        </Link>
      </div>
    );
  const { listing } = data;
  const coords = listing.geometry?.coordinates;
  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await reviews.add(id, review);
      setReview({ rating: 5, comment: "" });
      notify?.("Review posted");
      load();
    } catch (e) {
      user
        ? notify?.(e.response?.data?.error || "Unable to post review")
        : nav("/login");
    }
  };
  const toggle = async () => {
    if (!user) return nav("/login");
    try {
      data.isWishlisted ? await listings.remove(id) : await listings.add(id);
      setData({ ...data, isWishlisted: !data.isWishlisted });
      notify?.(
        data.isWishlisted ? "Removed from wishlist" : "Saved to wishlist",
      );
    } catch (e) {
      notify?.(e.response?.data?.error || "Wishlist failed");
    }
  };
  const deleteListing = async () => {
    if (!confirm("Delete this listing permanently?")) return;
    try {
      await listings.removeListing(id);
      notify?.("Listing deleted");
      nav("/listings");
    } catch (e) {
      notify?.(e.response?.data?.error || "Delete failed");
    }
  };
  const pay = async () => {
    if (!user) return nav("/login");
    if (!form.checkIn || !form.checkOut)
      return notify?.("Select check-in and check-out dates.");
    if (n <= 0) return notify?.("Check-out must be after check-in.");
    setBusy(true);
    try {
      const r = await booking.createOrder(id, form);
      if (!window.Razorpay) throw new Error("Razorpay checkout is not loaded.");
      const options = {
        key: r.data.key,
        amount: r.data.amount,
        currency: r.data.currency,
        name: "WanderNest",
        description: `Booking for ${listing.title}`,
        order_id: r.data.orderId,
        prefill: { name: user.username, email: user.email },
        handler: async (response) => {
          try {
            await booking.confirm(id, {
              ...form,
              ...response,
            });

            notify?.("Payment successful! Your booking is confirmed.");

            // Directly open My Orders
            nav("/orders");
          } catch (e) {
            notify?.(e.response?.data?.error || "Payment verification failed.");
          } finally {
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
        theme: { color: "#ff385c" },
      };
      new window.Razorpay(options).open();
    } catch (e) {
      notify?.(
        e.response?.data?.error || e.message || "Unable to start payment.",
      );
      setBusy(false);
    }
  };
  return (
    <section className="details">
      <div className="container">
        <div className="detail-top">
          <div>
            <span className="eyebrow">
              {listing.category || "STAY"} · WANDERNEST
            </span>
            <h1>{listing.title}</h1>
            <p className="location">
              <MapPin size={17} /> {listing.location}, {listing.country}
            </p>
          </div>
          <div className="owner-actions">
            {data.isOwner && (
              <>
                <Link className="btn btn-light" to={`/listings/${id}/edit`}>
                  <Edit3 size={16} /> Edit
                </Link>
                <button className="btn btn-danger" onClick={deleteListing}>
                  <Trash2 size={16} /> Delete
                </button>
              </>
            )}
          </div>
        </div>
        <div className="detail-gallery">
          <img src={listing.image?.url} alt={listing.title} />

          <div className="gallery-side">
            {/* Razorpay / Secure Booking Card */}
            <div className="trust-card payment-card">
              <div className="trust-icon">
                <ShieldCheck size={26} />
              </div>

              <div className="trust-content">
                <span className="trust-label">SECURE BOOKING</span>

                <h3>Razorpay Payments</h3>

                <p>
                  Secure online payments with server-side payment verification.
                </p>

                <div className="trust-points">
                  <span>✓ Razorpay Checkout</span>
                  <span>✓ Payment Signature Verified</span>
                  <span>✓ Secure Booking Confirmation</span>
                </div>
              </div>

              <div className="razorpay-badge">
                <span>Powered by</span>
                <strong>Razorpay</strong>
              </div>
            </div>

            {/* Location Mini Map */}
            <div className="trust-card location-card">
              {coords?.length === 2 ? (
                <div className="mini-map-wrapper">
                  <iframe
                    title="Property location"
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                      coords[0] - 0.03
                    }%2C${coords[1] - 0.03}%2C${coords[0] + 0.03}%2C${
                      coords[1] + 0.03
                    }&layer=mapnik&marker=${coords[1]}%2C${coords[0]}`}
                  />

                  <div className="map-overlay">
                    <div className="map-pin">
                      <Navigation size={16} />
                    </div>

                    <div>
                      <span>PROPERTY LOCATION</span>
                      <strong>
                        {listing.location}, {listing.country}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-map">
                  <Navigation size={25} />

                  <strong>Location</strong>

                  <span>
                    {listing.location}, {listing.country}
                  </span>
                </div>
              )}

              {coords?.length === 2 && (
                <a
                  className="map-open-btn"
                  href={`https://www.openstreetmap.org/?mlat=${coords[1]}&mlon=${coords[0]}#map=14/${coords[1]}/${coords[0]}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open full map ↗
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="map-panel panel">
          {coords?.length === 2 ? (
            <>
              <div className="map-head">
                <div>
                  <b>Explore the mapped location</b>
                  <span className="muted">
                    {listing.location}, {listing.country}
                  </span>
                </div>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${coords[1]}&mlon=${coords[0]}#map=14/${coords[1]}/${coords[0]}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open map ↗
                </a>
              </div>
              <div className="map-wrapper">
                <iframe
                  key={mapRefresh}
                  title="Property location map"
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                    coords[0] - 0.04
                  }%2C${coords[1] - 0.04}%2C${coords[0] + 0.04}%2C${
                    coords[1] + 0.04
                  }&layer=mapnik&marker=${coords[1]}%2C${coords[0]}`}
                />

                {/* Recenter Listing Location */}
                <button
                  type="button"
                  className="map-location-btn"
                  title="Return to property location"
                  aria-label="Return to property location"
                  onClick={() => setMapRefresh((value) => value + 1)}
                >
                  <Navigation size={19} />
                </button>
              </div>
            </>
          ) : (
            <p className="muted">
              Map coordinates are not available for this property.
            </p>
          )}
        </div>
        <div className="detail-grid">
          <main>
            <div className="detail-summary">
              <div>
                <h2>{listing.title}</h2>
                <p>{listing.description}</p>
              </div>
              <div className="price-big">
                ₹{Number(listing.price || 0).toLocaleString("en-IN")}
                <span>/night</span>
              </div>
            </div>
            <div className="reviews">
              <div className="section-head">
                <div>
                  <h3>Guest reviews</h3>
                  <p className="muted">Real feedback from WanderNest guests.</p>
                </div>
              </div>
              {(listing.reviews || []).length ? (
                (listing.reviews || []).map((r) => (
                  <div className="review" key={r._id}>
                    <div className="review-head">
                      <b>{r.author?.username || "Guest"}</b>
                      <span className="stars">
                        {"★".repeat(Number(r.rating || 0))}
                        {"☆".repeat(5 - Number(r.rating || 0))}
                      </span>
                    </div>
                    <div>{r.comment}</div>
                    {user && String(r.author?._id) === String(user.id) && (
                      <button
                        className="text-btn"
                        onClick={async () => {
                          await reviews.remove(id, r._id);
                          load();
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="panel">
                  No reviews yet — be the first to share your experience.
                </div>
              )}
              <form className="panel review-form" onSubmit={submitReview}>
                <h4>Share your experience</h4>
                <div className="field">
                  <label>Rating</label>
                  <select
                    value={review.rating}
                    onChange={(e) =>
                      setReview({ ...review, rating: e.target.value })
                    }
                  >
                    {[5, 4, 3, 2, 1].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Comment</label>
                  <textarea
                    rows="3"
                    required
                    value={review.comment}
                    onChange={(e) =>
                      setReview({ ...review, comment: e.target.value })
                    }
                    placeholder="What did you like about this stay?"
                  />
                </div>
                <button className="btn btn-primary">Post review</button>
              </form>
            </div>
            {/* Reality Check / Guest Stay Experience Feedback */}
            <div className="reality-check-section">
              <div className="section-head">
                <div>
                  <h3>✓ Guest Stay Experience Feedback</h3>
                  <p className="muted">
                    Real feedback from guests who have stayed here, helping you
                    understand how this property compares to its listing
                    description.
                  </p>
                </div>
              </div>

              {feedbackLoading ? (
                <div className="panel">
                  <p className="muted">Loading stay feedback...</p>
                </div>
              ) : realityFeedback.length > 0 ? (
                <div className="reality-feedback-list">
                  {realityFeedback.map((item) => (
                    <div className="reality-feedback-card" key={item._id}>
                      <div className="reality-feedback-top">
                        <div>
                          <b>{item.user?.username || "Guest"}</b>

                          {item.booking?.checkIn && item.booking?.checkOut && (
                            <span className="feedback-stay-date">
                              Stayed:{" "}
                              {new Date(
                                item.booking.checkIn,
                              ).toLocaleDateString()}{" "}
                              to{" "}
                              {new Date(
                                item.booking.checkOut,
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <span className="feedback-date">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString()
                            : ""}
                        </span>
                      </div>

                      <div className="feedback-ratings">
                        <div className="feedback-rating">
                          <span>🧹 Cleanliness</span>
                          <strong>
                            {"★".repeat(Number(item.ratings?.cleanliness || 0))}
                            {"☆".repeat(
                              5 - Number(item.ratings?.cleanliness || 0),
                            )}
                            <small> {item.ratings?.cleanliness || 0}/5</small>
                          </strong>
                        </div>

                        <div className="feedback-rating">
                          <span>📶 Wi-Fi Quality</span>
                          <strong>
                            {"★".repeat(Number(item.ratings?.wifiQuality || 0))}
                            {"☆".repeat(
                              5 - Number(item.ratings?.wifiQuality || 0),
                            )}
                            <small> {item.ratings?.wifiQuality || 0}/5</small>
                          </strong>
                        </div>

                        <div className="feedback-rating">
                          <span>🅿️ Parking</span>
                          <strong>
                            {"★".repeat(
                              Number(item.ratings?.parkingAvailability || 0),
                            )}
                            {"☆".repeat(
                              5 -
                                Number(item.ratings?.parkingAvailability || 0),
                            )}
                            <small>
                              {" "}
                              {item.ratings?.parkingAvailability || 0}/5
                            </small>
                          </strong>
                        </div>

                        <div className="feedback-rating">
                          <span>🛣️ Road Access</span>
                          <strong>
                            {"★".repeat(
                              Number(item.ratings?.roadAccessibility || 0),
                            )}
                            {"☆".repeat(
                              5 - Number(item.ratings?.roadAccessibility || 0),
                            )}
                            <small>
                              {" "}
                              {item.ratings?.roadAccessibility || 0}/5
                            </small>
                          </strong>
                        </div>

                        <div className="feedback-rating">
                          <span>📍 Location Accuracy</span>
                          <strong>
                            {"★".repeat(
                              Number(item.ratings?.locationAccuracy || 0),
                            )}
                            {"☆".repeat(
                              5 - Number(item.ratings?.locationAccuracy || 0),
                            )}
                            <small>
                              {" "}
                              {item.ratings?.locationAccuracy || 0}/5
                            </small>
                          </strong>
                        </div>

                        <div className="feedback-rating">
                          <span>✨ Amenities Accuracy</span>
                          <strong>
                            {"★".repeat(
                              Number(item.ratings?.amenitiesAccuracy || 0),
                            )}
                            {"☆".repeat(
                              5 - Number(item.ratings?.amenitiesAccuracy || 0),
                            )}
                            <small>
                              {" "}
                              {item.ratings?.amenitiesAccuracy || 0}/5
                            </small>
                          </strong>
                        </div>

                        <div className="feedback-rating">
                          <span>👤 Host Experience</span>
                          <strong>
                            {"★".repeat(
                              Number(item.ratings?.hostExperience || 0),
                            )}
                            {"☆".repeat(
                              5 - Number(item.ratings?.hostExperience || 0),
                            )}
                            <small>
                              {" "}
                              {item.ratings?.hostExperience || 0}/5
                            </small>
                          </strong>
                        </div>
                      </div>

                      <div className="listing-accuracy">
                        <b>Did the property match the listing?</b>

                        <span>
                          {item.listingAccuracy === "better_than_expected" &&
                            "👍 Better than expected"}

                          {item.listingAccuracy === "as_described" &&
                            "✓ As described"}

                          {item.listingAccuracy === "partially_different" &&
                            "⚠️ Partially different"}

                          {item.listingAccuracy === "significantly_different" &&
                            "❌ Significantly different"}
                        </span>
                      </div>

                      {item.comment && (
                        <div className="feedback-comment">
                          <b>Guest comment</b>
                          <p>{item.comment}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="panel">
                  <p className="muted">No stay experience feedback yet.</p>
                </div>
              )}
            </div>
          </main>
          <aside className="booking-box">
            <button
              className={"save-btn " + (data.isWishlisted ? "saved" : "")}
              onClick={toggle}
            >
              <Heart
                size={18}
                fill={data.isWishlisted ? "currentColor" : "none"}
              />{" "}
              {data.isWishlisted ? "Saved to wishlist" : "Save this stay"}
            </button>
            <div className="booking-heading">
              <div>
                <h3>Reserve your stay</h3>
                <span className="muted">Flexible dates · secure payment</span>
              </div>
              <CalendarDays />
            </div>
            <div className="field">
              <label>Check-in</label>
              <input
                type="date"
                min={minDate}
                value={form.checkIn}
                onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Check-out</label>
              <input
                type="date"
                min={form.checkIn || minDate}
                value={form.checkOut}
                onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
              />
            </div>
            <div className="field">
              <label>
                <Users size={14} /> Guests
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={form.guests}
                onChange={(e) => setForm({ ...form, guests: e.target.value })}
              />
            </div>
            <div className="price-breakdown">
              <div>
                <span>
                  ₹{Number(listing.price || 0).toLocaleString("en-IN")} ×{" "}
                  {n || 0} nights
                </span>
                <b>₹{subtotal.toLocaleString("en-IN")}</b>
              </div>
              <div>
                <span>Taxes (18%)</span>
                <span>₹{tax.toLocaleString("en-IN")}</span>
              </div>
              {discount > 0 && (
                <div className="discount">
                  <span>Long-stay discount</span>
                  <span>-₹{discount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <hr />
              <div className="total">
                <b>Total</b>
                <b>₹{total.toLocaleString("en-IN")}</b>
              </div>
            </div>
            <button
              disabled={busy}
              className="btn btn-primary reserve-btn"
              onClick={pay}
            >
              {busy ? (
                "Opening secure checkout..."
              ) : (
                <>Reserve & Pay · ₹{total.toLocaleString("en-IN")}</>
              )}
            </button>
            <p className="safe-note">
              <ShieldCheck size={15} /> Your payment is verified before a
              booking is created.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
