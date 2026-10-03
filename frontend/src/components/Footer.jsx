import { Globe, Heart } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">

        {/* Brand */}
        <div>
          <div className="brand">
            Wander<span>Nest</span>
          </div>

          <p>
            Travel, discover and book stays with a smarter WanderNest
            experience.
          </p>
        </div>

        {/* Explore */}
        <div>
          <b>Explore</b>

          <a href="/listings">Stays</a>
          <a href="/wishlist">Wishlist</a>
          <a href="/orders">My Orders</a>
        </div>

        {/* Connect */}
        <div>
          <b>Connect</b>

          <div className="footer-social">
            <a
              href="https://github.com/as588895"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
            >
              <FaGithub size={17} />
            </a>

            <a
              href="https://www.linkedin.com/in/aman-singh-222364298/"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
            >
              <FaLinkedin size={17} />
            </a>

            <a
              href="https://www.aman-singh.dev/"
              target="_blank"
              rel="noreferrer"
              aria-label="Portfolio"
            >
              <Globe size={17} />
            </a>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="container footer-bottom">
        Built with <Heart size={14} fill="currentColor" /> for better travel
        experiences.
      </div>
    </footer>
  );
}