import { useState } from "react";
import { auth } from "../services/api";

export default function Profile({ user }) {
  const [f, setF] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    setMsg("");
    setErr("");

    // Frontend validation
    if (f.newPassword !== f.confirmPassword) {
      setErr("New password and confirm password do not match.");
      return;
    }

    if (f.newPassword.length < 6) {
      setErr("New password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      console.log("Changing password...");

      const r = await auth.changePassword({
  oldPassword: f.oldPassword,
  newPassword: f.newPassword,
  confirmPassword: f.confirmPassword,
});
  // CONSOLE
console.log("REQUEST FINISHED");
console.log("STATUS:", r.status);
console.log("DATA:", r.data);

      console.log("Change password response:", r.data);

      setMsg(r.data?.message || "Password changed successfully.");

      setF({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Change password error:", error);

      console.error("Status:", error.response?.status);
      console.error("Response:", error.response?.data);

      setErr(
        error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Unable to change password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section">
      <div className="container profile-grid">
        {/* Profile */}
        <div className="profile-card">
          <div className="avatar">
            {user?.username?.[0]?.toUpperCase() || "U"}
          </div>

          <span className="eyebrow">WANDERNEST MEMBER</span>

          <h1>{user?.username}</h1>

          <p className="muted">{user?.email}</p>

          <div className="profile-stat">
            <b>Traveller account</b>
            <span>
              Wishlist, bookings, reviews & secure checkout enabled.
            </span>
          </div>
        </div>

        {/* Change Password */}
        <form className="panel auth-card" onSubmit={submit}>
          <span className="eyebrow">ACCOUNT SECURITY</span>

          <h2>Change password</h2>

          <p className="muted">
            Update your password to keep your WanderNest account secure.
          </p>

          {err && <div className="error-box">{err}</div>}

          {msg && <div className="success-box">{msg}</div>}

          <div className="field">
            <label>Current password</label>

            <input
              type="password"
              required
              autoComplete="current-password"
              value={f.oldPassword}
              onChange={(e) =>
                setF({
                  ...f,
                  oldPassword: e.target.value,
                })
              }
            />
          </div>

          <div className="field">
            <label>New password</label>

            <input
              type="password"
              minLength={6}
              required
              autoComplete="new-password"
              value={f.newPassword}
              onChange={(e) =>
                setF({
                  ...f,
                  newPassword: e.target.value,
                })
              }
            />
          </div>

          <div className="field">
            <label>Confirm new password</label>

            <input
              type="password"
              minLength={6}
              required
              autoComplete="new-password"
              value={f.confirmPassword}
              onChange={(e) =>
                setF({
                  ...f,
                  confirmPassword: e.target.value,
                })
              }
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary form-submit"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </section>
  );
}