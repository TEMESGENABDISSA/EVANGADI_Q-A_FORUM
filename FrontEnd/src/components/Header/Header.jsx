import { useContext } from "react";
import classes from "./header.module.css";
import EvangadiLogo from "../../Assets/Images/evangadi-logo-header.png";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { Navbar, Nav, Button, Container } from "react-bootstrap";
import { UserState } from "../../App.jsx";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
import NotificationBell from "../NotificationBell/NotificationBell";
import { useTheme } from "../../context/ThemeContext";

function Header() {
  const { user, setUser } = useContext(UserState);
  const userId = user?.userid;
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleLogoClick = (e) => {
    e.preventDefault();
    navigate('/home');
  };

  const handleSignOut = () => {
    localStorage.removeItem("Evangadi_Forum");
    setUser(null);
    navigate('/auth');
  };

  return (
    <>
      <Navbar
        expand="md"
        className={`px-3 ${classes.navbar} ${
          isDarkMode ? classes.dark : classes.light
        }`}
      >
        <Container className={classes.header_container}>
          <Navbar.Brand as="div" style={{ cursor: 'pointer' }} onClick={handleLogoClick}>
            <img
              src={EvangadiLogo}
              className="d-inline-block align-top"
              alt="Evangadi Logo"
              width="200"
            />
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="basic-navbar-nav d-md-none">
            <span className="navbar-toggler-icon"></span>
          </Navbar.Toggle>

          <Navbar.Collapse
            id="basic-navbar-nav"
            className="w-50 flex-md-row"
            style={{ alignSelf: "flex-end" }}
          >
            <Nav className="flex-column flex-md-row w-100 justify-content-end nav-links-holder">
              {/* ✅ Always display Home */}
              <Nav.Link
                as={Link}
                to="/home"
                className={classes.navigation_links}
              >
                Home
              </Nav.Link>

              <Nav.Link as={Link} to="/how-it-works" className={classes.navigation_links}>
                How it Works
              </Nav.Link>

              {/* Theme Toggle */}
              <div className={classes.themeToggleContainer}>
                <ThemeToggle />
              </div>

              {/* Notification Bell - only show for logged in users */}
              {userId && (
                <div className={classes.notificationContainer}>
                  <NotificationBell />
                </div>
              )}

              {userId ? (
                <div className={classes.userSection}>
                  <span className={classes.userName}>
                    Welcome, {user?.username}
                  </span>
                  <Button
                    onClick={handleSignOut}
                    className={classes.logout_btn}
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <Nav.Link
                  as={Link}
                  to="/auth"
                  className={`${classes.navigation_links} ${classes.login_btn}`}
                >
                  Login
                </Nav.Link>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
}

export default Header;
