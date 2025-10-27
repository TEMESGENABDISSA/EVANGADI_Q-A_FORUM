import { useState } from "react";
import { axiosInstance } from "../../utility/axios";
import classes from "./login.module.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Swal from "sweetalert2";
import ForgotPassword from "../Password/ForgetPasword";

function Login({ onSwitch }) {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [formData, setFormData] = useState({
    usernameOrEmail: "",
    password: "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleTogglePassword = () => setShowPassword((prev) => !prev);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post("/user/login", formData);

      localStorage.setItem("Evangadi_Forum", response.data.token);
      window.location.href = "/home";

      setSuccess("Login successful! Redirecting...");
      setError(null);

      await Swal.fire({
        title: "Success!",
        text: response.data.message,
        icon: "success",
        confirmButtonText: "OK",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Error logging in.");
      setSuccess(null);
      await Swal.fire({
        title: "Error",
        text: err.response?.data?.message || "Login failed",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  if (showForgotPassword)
    return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;

  return (
    <div className={classes.formcontainer}>
      <div className={classes.innerContainer}>
        <div className={classes.heading}>
          <h2 className={classes.title}>Login to your account</h2>
          <p className={classes.signuptext}>
            Don't have an account?{" "}
            <a
              onClick={onSwitch}
              style={{ cursor: "pointer", color: "var(--primary-color)" }}
            >
              create a new account
            </a>
          </p>
          {error && <p className={classes.error}>{error}</p>}
          {success && <p className={classes.success}>{success}</p>}
        </div>

        <form onSubmit={handleSubmit} autoComplete="off">
          <input
            type="text"
            name="usernameOrEmail"
            placeholder="Username or Email"
            value={formData.usernameOrEmail}
            onChange={handleChange}
            autoComplete="username"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            required
          />
          <div className={classes.passwordinput}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              required
            />
            <button type="button" onClick={handleTogglePassword}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <p className={classes.forgotpasswordtext}>
            <span onClick={() => setShowForgotPassword(true)}>
              Forgot password?
            </span>
          </p>

          <button type="submit" className={classes.submitbtn}>
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
