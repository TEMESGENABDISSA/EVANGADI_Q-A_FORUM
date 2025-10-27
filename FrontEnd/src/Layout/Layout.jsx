import Header from "./../components/Header/Header.jsx";
import Footer from "./../components/Footer/Footer.jsx";
import Chatbot from "./../components/ChatBot/Chatbot.jsx";
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
      <Chatbot />
    </div>
  );
}

export default Layout;
