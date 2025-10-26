import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { axiosInstance } from "../../utility/axios";
import classes from "./PasswordReset.module.css";
import { FaArrowLeft } from "react-icons/fa"; // ✅ correct icon import
import Layout from "../../Layout/Layout.jsx";

export default function PasswordReset() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setMessage(null);
      return;
    }

    try {
      const response = await axiosInstance.post(
        `/user/resetPassword/${token}`,
        { password }
      );
      setMessage(response.data.msg || "Password reset successful!");
      setError(null);
      setTimeout(() => navigate("/auth"), 2000);
    } catch (err) {
      setError(err.response?.data?.msg || "Invalid or expired reset link.");
      setMessage(null);
    }
  };

  return (
    <Layout>
      <div className={classes.formcontainer}>
        <div className={classes.innerContainer}>
          <h2>Reset Your Password</h2>
          <p>Please enter your new password below.</p>

          {message && <p className={classes.success}>{message}</p>}
          {error && <p className={classes.error}>{error}</p>}

          <form onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button type="submit" className={classes.submitbtn}>
              Reset Password
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
