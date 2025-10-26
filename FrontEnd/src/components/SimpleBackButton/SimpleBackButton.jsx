import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import styles from "./SimpleBackButton.module.css";

function SimpleBackButton({ text = "Go Back" }) {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <button 
      onClick={handleGoBack} 
      className={styles.backButton}
      aria-label="Go back"
    >
      <FaArrowLeft className={styles.icon} />
      <span>{text}</span>
    </button>
  );
}

export default SimpleBackButton;
