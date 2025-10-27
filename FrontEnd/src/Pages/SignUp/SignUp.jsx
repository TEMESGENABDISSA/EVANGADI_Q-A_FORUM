import { useState, useEffect } from "react";
import classes from "./signUp.module.css";
import { Link } from "react-router-dom";
import { axiosInstance } from "../../utility/axios";
import Swal from "sweetalert2";
import { FaEye, FaEyeSlash, FaCheckCircle, FaTimesCircle, FaInfoCircle } from "react-icons/fa";

function Signup({ onSwitch }) {
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  
  const [formErrors, setFormErrors] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: "",
    color: "#ff0000"
  });

  // Validation rules
  const validateField = (name, value) => {
    let error = "";
    
    switch (name) {
      case 'username':
        if (!value) {
          error = 'Username is required';
        } else if (!/^[a-zA-Z0-9_-]{3,20}$/.test(value)) {
          error = 'Username must be 3-20 characters and can only contain letters, numbers, underscores, or hyphens';
        }
        break;
      case 'firstName':
      case 'lastName':
        if (!value) {
          error = `${name === 'firstName' ? 'First name' : 'Last name'} is required`;
        } else if (!/^[a-zA-Z\s-']{2,50}$/.test(value)) {
          error = `${name === 'firstName' ? 'First name' : 'Last name'} must be 2-50 characters and contain only letters, spaces, hyphens, or apostrophes`;
        }
        break;
      case 'email':
        if (!value) {
          error = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'password':
        if (!value) {
          error = 'Password is required';
        } else if (value.length < 8) {
          error = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])/.test(value)) {
          error = 'Password must contain at least one lowercase letter';
        } else if (!/(?=.*[A-Z])/.test(value)) {
          error = 'Password must contain at least one uppercase letter';
        } else if (!/(?=.*\d)/.test(value)) {
          error = 'Password must contain at least one number';
        } else if (!/(?=.*[!@#$%^&*])/.test(value)) {
          error = 'Password must contain at least one special character (!@#$%^&*)';
        }
        break;
      default:
        break;
    }
    
    return error;
  };
  
  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    let score = 0;
    let label = 'Very Weak';
    let color = '#ff0000';
    
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*]/.test(password)) score++;
    
    switch(score) {
      case 1:
        label = 'Very Weak';
        color = '#ff0000';
        break;
      case 2:
        label = 'Weak';
        color = '#ff6b6b';
        break;
      case 3:
        label = 'Moderate';
        color = '#feca57';
        break;
      case 4:
        label = 'Strong';
        color = '#1dd1a1';
        break;
      case 5:
        label = 'Very Strong';
        color = '#10ac84';
        break;
      default:
        break;
    }
    
    return { score, label, color };
  };
  
  // Update form validity whenever form data or errors change
  useEffect(() => {
    const hasErrors = Object.values(formErrors).some(error => error !== '');
    const hasEmptyFields = Object.values(formData).some(value => value.trim() === '');
    setIsFormValid(!hasErrors && !hasEmptyFields);
  }, [formData, formErrors]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // If password field changes, update password strength
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
    
    // Validate field and update errors
    const error = validateField(name, value);
    setFormErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };
  
  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFormErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev); // Toggle the visibility state
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    
    // Validate all fields
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      newErrors[key] = error;
      if (error) isValid = false;
    });
    
    setFormErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const isValid = validateForm();
    if (!isValid) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      const response = await axiosInstance.post("/user/register", {
        // Sending user registration data
        username: formData.username,
        full_name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
      });
    
      if (response.status === 201) {
        // Show a success alert for registration
        await Swal.fire({
          title: "Success!",
          text: "User registered successfully! Logging in...",
          icon: "success",
          confirmButtonText: "OK",
        });

        // Immediately log the user in after registration
        try {
          const loginResponse = await axiosInstance.post("/user/login", {
            email: formData.email,
            password: formData.password,
          });

          if (loginResponse.status === 200) {
            localStorage.setItem("Evangadi_Forum", loginResponse.data.token);
            window.location.href = "/";
          } else {
            throw new Error(loginResponse.data.msg || "Login failed. Please try again.");
          }
        } catch (loginError) {
          console.error("Login error:", loginError);
          throw new Error(loginError.response?.data?.message || "An error occurred during login. Please try again.");
        }
      } else {
        throw new Error(response.data.message || "Error submitting the form. Please try again.");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "An unexpected error occurred. Please try again.";
      await Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

 
  return (
    <div className={classes.formcontainer}>
      <h2>Join the network</h2>
      <p className="signin-text">
        Already have an account?{" "}
        <a
          onClick={onSwitch}
          style={{ cursor: "pointer", color: "var(--primary-color)" }}
        >
          Sign in
        </a>
      </p>
      <form method="POST" onSubmit={handleSubmit}>
        {/* Username Field */}
        <div className={classes.formGroup}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`${formErrors.username ? classes.errorInput : ''} ${formData.username && !formErrors.username ? classes.validInput : ''}`}
            required
          />
          {formData.username && !formErrors.username && (
            <FaCheckCircle className={classes.validIcon} />
          )}
          {formErrors.username && (
            <div className={classes.errorMessage}>
              <FaInfoCircle /> {formErrors.username}
            </div>
          )}
        </div>

        {/* Name Fields */}
        <div className={classes.nameinputs}>
          <div className={classes.formGroup}>
            <input
              type="text"
              name="firstName"
              placeholder="First name"
              value={formData.firstName}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${formErrors.firstName ? classes.errorInput : ''} ${formData.firstName && !formErrors.firstName ? classes.validInput : ''}`}
              required
            />
            {formData.firstName && !formErrors.firstName && (
              <FaCheckCircle className={classes.validIcon} />
            )}
            {formErrors.firstName && (
              <div className={classes.errorMessage}>
                <FaInfoCircle /> {formErrors.firstName}
              </div>
            )}
          </div>

          <div className={classes.formGroup}>
            <input
              type="text"
              name="lastName"
              placeholder="Last name"
              value={formData.lastName}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${formErrors.lastName ? classes.errorInput : ''} ${formData.lastName && !formErrors.lastName ? classes.validInput : ''}`}
              required
            />
            {formData.lastName && !formErrors.lastName && (
              <FaCheckCircle className={classes.validIcon} />
            )}
            {formErrors.lastName && (
              <div className={classes.errorMessage}>
                <FaInfoCircle /> {formErrors.lastName}
              </div>
            )}
          </div>
        </div>

        {/* Email Field */}
        <div className={classes.formGroup}>
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`${formErrors.email ? classes.errorInput : ''} ${formData.email && !formErrors.email ? classes.validInput : ''}`}
            required
          />
          {formData.email && !formErrors.email && (
            <FaCheckCircle className={classes.validIcon} />
          )}
          {formErrors.email && (
            <div className={classes.errorMessage}>
              <FaInfoCircle /> {formErrors.email}
            </div>
          )}
        </div>

        {/* Password Field */}
        <div className={classes.formGroup}>
          <div className={classes.passwordinput}>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${formErrors.password ? classes.errorInput : ''} ${formData.password && !formErrors.password ? classes.validInput : ''}`}
              required
            />
            <button
              type="button"
              onClick={handleTogglePassword}
              className={classes.togglePassword}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>

            {formData.password && (
              <div className={classes.passwordStrength}>
                <div
                  className={classes.strengthMeter}
                  style={{ width: `${(passwordStrength.score / 5) * 100}%`, backgroundColor: passwordStrength.color }}
                ></div>
                <div className={classes.strengthLabel}>
                  {formData.password ? `Strength: ${passwordStrength.label}` : ''}
                </div>
              </div>
            )}

            {formData.password && formErrors.password && (
              <div className={classes.errorMessage}>
                <FaInfoCircle /> {formErrors.password}
              </div>
            )}

            <div className={classes.passwordRequirements}>
              <h4>Password must contain:</h4>
              <ul>
                <li className={formData.password.length >= 8 ? classes.requirementMet : ''}>
                  {formData.password.length >= 8 ? <FaCheckCircle /> : <FaTimesCircle />}
                  At least 8 characters
                </li>
                <li className={/(?=.*[a-z])/.test(formData.password) ? classes.requirementMet : ''}>
                  {/(?=.*[a-z])/.test(formData.password) ? <FaCheckCircle /> : <FaTimesCircle />}
                  One lowercase letter
                </li>
                <li className={/(?=.*[A-Z])/.test(formData.password) ? classes.requirementMet : ''}>
                  {/(?=.*[A-Z])/.test(formData.password) ? <FaCheckCircle /> : <FaTimesCircle />}
                  One uppercase letter
                </li>
                <li className={/(?=.*\d)/.test(formData.password) ? classes.requirementMet : ''}>
                  {/(?=.*\d)/.test(formData.password) ? <FaCheckCircle /> : <FaTimesCircle />}
                  One number
                </li>
                <li className={/(?=.*[!@#$%^&*])/.test(formData.password) ? classes.requirementMet : ''}>
                  {/(?=.*[!@#$%^&*])/.test(formData.password) ? <FaCheckCircle /> : <FaTimesCircle />}
                  One special character (!@#$%^&*)
                </li>
              </ul>
            </div>

            <div className={classes.termsText}>
              I agree to the <Link to="/privacyPolicy">privacy policy</Link> and{' '}
              <Link to="/terms">terms of service</Link>.
            </div>
          </div>
        </div>

        <button
          type="submit"
          className={`${classes.submitbtn} ${!isFormValid ? classes.disabledButton : ''}`}
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? 'Creating Account...' : 'Agree and Join'}
        </button>
        <p className={classes.signintext}>
          Already have an account?{' '}
          <a 
            onClick={onSwitch} 
            style={{ cursor: 'pointer', color: 'var(--primary-color)' }}
          >
            Sign in
          </a>
        </p>
      </form>
    </div>
  );
}

export default Signup;
