import  { useContext, useRef } from "react";
import classes from "./askQuestion.module.css";
import { axiosInstance } from "../../utility/axios.js";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../Layout/Layout.jsx";
import { UserState } from "../../App.jsx";
// this is imported for bootstrap sweet alert
import Swal from "sweetalert2";

function AskQuestion() {
  const navigate = useNavigate();
  const { user } = useContext(UserState);
  const titleDom = useRef();
  const descriptionDom = useRef();
  
  // Ensure we have a valid user ID or use a guest ID
  const getUserId = () => {
    if (user?.userid) return user.userid;
    // Generate a guest ID if user is not logged in
    const guestId = localStorage.getItem('guestId') || `guest-${Date.now()}`;
    if (!localStorage.getItem('guestId')) {
      localStorage.setItem('guestId', guestId);
    }
    return guestId;
  };
  
  const userId = getUserId();

  async function handleSubmit(e) {
    e.preventDefault();
    
    // Validate inputs
    const title = titleDom.current?.value?.trim();
    const description = descriptionDom.current?.value?.trim();
    
    if (!title || !description) {
      await Swal.fire({
        title: "Incomplete Form",
        text: "Please fill in both title and description fields.",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }
    
    const tag = "General";

    try {
      // Make a POST request to create a new question
      const response = await axiosInstance.post("/question", {
        userid: userId,
        title,
        description,
        tag,
      }, {
        validateStatus: (status) => status < 500 // Don't throw for 4xx errors
      });
      if (response.status === 201) {
        console.log("Question created successfully");
        await Swal.fire({
          title: "Success!",
          text: "Question created successfully!",
          icon: "success",
          confirmButtonText: "OK",
        });
        navigate("/");
      } else {
        console.error("Failed to create question");
        await Swal.fire({
          title: "Error",
          text: "Failed to create question",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error(error);
      await Swal.fire({
        title: "Error",
        text: "Failed to create question. Please try again later.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  }

  return (
    <Layout>
      <div className={classes.allContainer}>
        <div className={classes.question__container}>
          <div className={classes.question__wrapper}>
            <h3 className={classes.question__header__title}>
              <span className={classes.highlight}>
                Steps To Write A Good Question
              </span>
            </h3>

            <div className={classes.questionContainer}>
              <h2 className={classes.questionTitle}>
                How to Ask a Good Question
              </h2>
              <div className={classes.questionList}>
                <ul className={classes.questionListUl}>
                  <li className={classes.questionItem}>
                    <span className={classes.icon}></span>
                    Summarize your problem in a one-line title.
                  </li>

                    Describe your problem in more detail.
              
                    Explain what you have tried and what you expected to happen.
                    Review your question and post it to the site.
                  
                </ul>
              </div>
            </div>
          </div>
          <div className={classes.question__header__titleTwo}>
            <form onSubmit={handleSubmit} className={classes.question__form}>
              <input
                className={classes.question__title2}
                ref={titleDom}
                type="text"
                placeholder="Question title"
                required
              />
              <textarea
                rows={4}
                className={classes.question__description}
                ref={descriptionDom}
                type="text"
                placeholder="Question Description..."
                required
              />
              <div className={classes.buttonContainer}>
                <button className={classes.question__button} type="submit">
                  Post Question
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default AskQuestion;
