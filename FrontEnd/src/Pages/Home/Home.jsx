import { useContext } from "react";
import styles from "./home.module.css";
import Questions from "../Question/Questions.jsx";
import Layout from "../../Layout/Layout.jsx";
import { Link, useNavigate } from "react-router-dom";
import { UserState } from "../../App.jsx";
import Swal from "sweetalert2";

function Home() {
  const { user } = useContext(UserState);
  const navigate = useNavigate();
  const userName = String(user?.username);

  const handleAskQuestion = () => {
    if (!user || !user.userid) {
      Swal.fire({
        title: "Login Required",
        text: "Please log in to ask a question.",
        icon: "info",
        confirmButtonText: "Go to Login",
        showCancelButton: true,
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/auth");
        }
      });
    } else {
      navigate("/ask");
    }
  };

  return (
    <Layout>
      <div className={styles.home_container}>
        <div className={styles.ask_welcome_holder}>
          <div className={styles.ask_question}>
            <button
              className={styles.ask_btn}
              onClick={handleAskQuestion}
              style={{ textDecoration: "none" }}
            >
              <span>ASK QUESTIONS</span>
            </button>
          </div>
        </div>

        <div className={styles.questions_list}>
          <Questions />
        </div>
      </div>
    </Layout>
  );
}

export default Home;
