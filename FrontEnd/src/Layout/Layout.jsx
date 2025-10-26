import Header from "./../components/Header/Header.jsx";
import Footer from "./../components/Footer/Footer.jsx";
// Temporarily comment out Chatbot import to test build
// import Chatbot from "./../components/Chatbot/Chatbot.jsx";
import { useTheme } from "./../context/ThemeContext";
import classes from "./Layout.module.css";

function Layout({ children }) {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`${classes.layout} ${
        isDarkMode ? classes.dark : classes.light
      }`}
    >
      <Header />
      <div className={classes.content}>{children}</div>
      <Footer />
      {/* Temporarily removed Chatbot component */}
    </div>
  );
}

export default Layout;
