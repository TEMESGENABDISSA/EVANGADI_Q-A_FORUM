import { useState } from "react";
import { axiosInstance } from "../../utility/axios";
import classes from "./ForgetPasword.module.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => setEmail(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post("/user/forgotPassword", {
        email,
      });
      setMessage(response.data.msg);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.msg || "Error sending reset link.");
      setMessage(null);
    }
  };

  return (
    <div className={classes.formcontainer}>
      <div className={classes.innerContainer}>
        <h2>Forgot your password?</h2>
        <p>
          Enter your email address, and we'll send you a link to reset your
          password.
        </p>
        {message && <p className={classes.success}>{message}</p>}
        {error && <p className={classes.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={handleChange}
            required
          />
          <button type="submit" className={classes.submitbtn}>
            Send reset link
          </button>
        </form>
      </div>
    </div>
  );
}
