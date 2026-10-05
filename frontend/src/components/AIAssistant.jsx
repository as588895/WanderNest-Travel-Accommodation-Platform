
import {
  Bot,
  Send,
  X,
  Sparkles,
  MapPin,
  Wallet,
  Compass,
  RotateCcw,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ai } from "../services/api";

const suggestions = [
  {
    label: "Beach stay in Goa",
    icon: MapPin,
    prompt: "Suggest a beach stay in Goa",
  },
  {
    label: "Under ₹5,000/night",
    icon: Wallet,
    prompt: "Find stays under ₹5000 per night",
  },
  {
    label: "Plan a 3-day trip",
    icon: Compass,
    prompt: "Help me plan a 3-day trip with suitable stays",
  },
];

const fallbackImage =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80";

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const [msgs, setMsgs] = useState([
    {
      role: "bot",
      text: "Hi, Aman! 👋 I’m your WanderNest travel companion. Tell me your destination, budget, or trip idea and I’ll help you explore available stays.",
      listings: [],
    },
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [msgs, sending, open]);

  const send = async (e, prompt) => {
    e?.preventDefault();

    const question = String(prompt ?? text).trim();

    if (!question || sending) return;

    setText("");

    setMsgs((current) => [
      ...current,
      { role: "me", text: question, listings: [] },
    ]);

    setSending(true);

    try {
      const response = await ai.chat(question);

      const reply =
        response.data.reply ||
        "I couldn’t find a clear answer. Try sharing your destination and budget.";

      const recommendedListings = Array.isArray(response.data.listings)
        ? response.data.listings.filter((listing) => listing.id)
        : [];

      setMsgs((current) => [
        ...current,
        {
          role: "bot",
          text: reply,
          listings: recommendedListings,
        },
      ]);
    } catch (err) {
      setMsgs((current) => [
        ...current,
        {
          role: "bot",
          text:
            err.response?.data?.error ||
            "I’m having trouble connecting right now. Please try again in a moment, or search stays directly on WanderNest.",
          listings: [],
        },
      ]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const resetChat = () => {
    setMsgs([
      {
        role: "bot",
        text: "Fresh plans, fresh possibilities ✨ Where would you like to go, and what’s your budget?",
        listings: [],
      },
    ]);

    setText("");
  };

  return (
    <div className="ai">
      {open && (
        <section
          className="ai-panel"
          aria-label="WanderNest AI travel assistant"
        >
          <header className="ai-head">
            <div className="ai-avatar">
              <Sparkles size={19} />
            </div>

            <div className="ai-heading-copy">
              <b>WanderNest AI</b>
              <span>
                <span className="ai-online-dot" />
                Your personal travel companion
              </span>
            </div>

            <div className="ai-head-actions">
              <button
                type="button"
                aria-label="Start a new chat"
                onClick={resetChat}
              >
                <RotateCcw size={17} />
              </button>

              <button
                type="button"
                aria-label="Close assistant"
                onClick={() => setOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
          </header>

          <div className="ai-msgs">
            {msgs.map((message, index) => (
              <div
                key={`${index}-${message.role}`}
                className={`ai-message-row ${
                  message.role === "me" ? "from-user" : "from-bot"
                }`}
              >
                {message.role === "bot" && (
                  <span className="ai-message-avatar">
                    <Sparkles size={13} />
                  </span>
                )}

                <div className="ai-message-content">
                  <div
                    className={`msg ${
                      message.role === "me" ? "me" : "bot"
                    }`}
                    style={{ whiteSpace: "pre-line" }}
                  >
                    {message.text}
                  </div>

                  {message.role === "bot" &&
                    message.listings?.length > 0 && (
                      <div className="ai-recommended-listings">
                        <div className="ai-recommendation-heading">
                          <Sparkles size={15} />
                          <span>Recommended stays</span>
                        </div>

                        {message.listings.map((listing) => (
                          <Link
                            key={listing.id}
                            to={`/listings/${listing.id}`}
                            className="ai-listing-card"
                            onClick={() => setOpen(false)}
                          >
                            <img
                              src={listing.image?.url || fallbackImage}
                              alt={listing.title || "Recommended stay"}
                              loading="lazy"
                            />

                            <div className="ai-listing-info">
                              <strong>
                                {listing.title || "WanderNest Stay"}
                              </strong>

                              <span className="ai-listing-location">
                                <MapPin size={13} />
                                {[listing.location, listing.country]
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>

                              <span className="ai-listing-price">
                                ₹
                                {Number(listing.price || 0).toLocaleString(
                                  "en-IN"
                                )}
                                <span>/ night</span>
                              </span>

                              <span className="ai-listing-view">
                                View property <ArrowRight size={13} />
                              </span>
                            </div>

                            <ExternalLink
                              className="ai-listing-external"
                              size={15}
                            />
                          </Link>
                        ))}

                        <p className="ai-listing-hint">
                          Select any stay to view its details and booking
                          options.
                        </p>
                      </div>
                    )}
                </div>
              </div>
            ))}

            {sending && (
              <div className="ai-message-row from-bot">
                <span className="ai-message-avatar">
                  <Sparkles size={13} />
                </span>

                <div
                  className="msg bot ai-typing"
                  aria-label="WanderNest AI is thinking"
                >
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            )}

            {msgs.length === 1 && !sending && (
              <div className="ai-suggestions">
                <span className="ai-suggestions-label">TRY ASKING</span>

                {suggestions.map(({ label, icon: Icon, prompt }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => send(null, prompt)}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form className="ai-form" onSubmit={send}>
            <input
              ref={inputRef}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Ask about destinations or budget..."
              aria-label="Message WanderNest AI"
              maxLength={500}
              disabled={sending}
            />

            <button
              className="ai-send-btn"
              type="submit"
              disabled={!text.trim() || sending}
              aria-label="Send message"
            >
              <Send size={17} />
            </button>
          </form>

          <div className="ai-footnote">
            AI suggestions are based on available WanderNest listings.
          </div>
        </section>
      )}

      <button
        className="btn btn-primary ai-launcher"
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? (
          <X size={18} />
        ) : (
          <>
            <span className="ai-launcher-icon">
              <Bot size={19} />
            </span>
            <span>WanderNest AI</span>
            <Sparkles size={15} />
          </>
        )}
      </button>
    </div>
  );
}