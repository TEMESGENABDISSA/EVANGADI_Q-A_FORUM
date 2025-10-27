import  { useContext, useRef, useState, useEffect } from "react";
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
  const [titleLength, setTitleLength] = useState(0);
  const [descriptionLength, setDescriptionLength] = useState(0);
  const MAX_TITLE_LENGTH = 200;
  const MAX_DESCRIPTION_LENGTH = 2000;
  const MIN_TITLE_LENGTH = 10;
  const MIN_DESCRIPTION_LENGTH = 20;
  
  // Check if user is logged in
  const userId = user?.userid;
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userId) {
      Swal.fire({
        title: "Login Required",
        text: "Please log in to ask a question.",
        icon: "info",
        confirmButtonText: "Go to Login",
      }).then(() => {
        navigate("/login");
      });
    }
  }, [userId, navigate]);

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
    
    // Validate minimum lengths
    if (title.length < MIN_TITLE_LENGTH) {
      await Swal.fire({
        title: "Title Too Short",
        text: `Title must be at least ${MIN_TITLE_LENGTH} characters long.`,
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }
    
    if (description.length < MIN_DESCRIPTION_LENGTH) {
      await Swal.fire({
        title: "Description Too Short",
        text: `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters long.`,
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
        await Swal.fire({
          title: "Success!",
          text: "Question created successfully!",
          icon: "success",
          confirmButtonText: "OK",
        });
        navigate("/");
      } else {
        await Swal.fire({
          title: "Error",
          text: "Failed to create question",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
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
              <div className={classes.formGroup}>
                <input
                  className={classes.question__title2}
                  ref={titleDom}
                  type="text"
                  placeholder="Question title"
                  maxLength={MAX_TITLE_LENGTH}
                  onChange={(e) => setTitleLength(e.target.value.length)}
                  required
                />
                <div className={classes.charCounter}>
                  {titleLength}/{MAX_TITLE_LENGTH} characters
                  {titleLength > 0 && titleLength < MIN_TITLE_LENGTH && (
                    <span className={classes.warningText}> (min {MIN_TITLE_LENGTH})</span>
                  )}
                </div>
              </div>
              <div className={classes.formGroup}>
                <textarea
                  rows={6}
                  className={classes.question__description}
                  ref={descriptionDom}
                  type="text"
                  placeholder="Question Description..."
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  onChange={(e) => setDescriptionLength(e.target.value.length)}
                  required
                />
                <div className={classes.charCounter}>
                  {descriptionLength}/{MAX_DESCRIPTION_LENGTH} characters
                  {descriptionLength > 0 && descriptionLength < MIN_DESCRIPTION_LENGTH && (
                    <span className={classes.warningText}> (min {MIN_DESCRIPTION_LENGTH})</span>
                  )}
                </div>
              </div>
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
