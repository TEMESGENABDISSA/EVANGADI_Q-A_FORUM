import { useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { axiosInstance } from "../../utility/axios.js";
import { UserState } from "../../App.jsx";
import Layout from "../../Layout/Layout.jsx";
import classes from "./askQuestion.module.css";

function AskQuestion() {
  const navigate = useNavigate();
  const { user } = useContext(UserState);

  const titleRef = useRef();
  const descriptionRef = useRef();
  const userId = user?.userid;

  async function handleSubmit(e) {
    e.preventDefault();
 
    const title = titleRef.current.value;
    const description = descriptionRef.current.value;
    const tag = "General";

    if (!title || !description || !userId) {
      Swal.fire("Error", "Please fill all fields", "error");
      return;
    }

    try {
      const response = await axiosInstance.post("/question", {
        userid: userId,
        title,
        description,
        tag,
      });

      if (response.status === 201) {
        Swal.fire("Success", "Question posted successfully!", "success");
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      Swal.fire(
        "Error",
        "Failed to create question. Please try again later.",
        "error"
      );
    }
  }

  return (
    <Layout>
      <div className={classes.container}>
        <h2 className={classes.header}>Ask a Question</h2>

        {/* Guidelines Section */}
        <div className={classes.guidelines}>
          <h3>Steps to Write a Good Question</h3>
          <ul>
            <li>Summarize your problem in a one-line title.</li>
            <li>Describe your problem in more detail.</li>
            <li>
              Explain what you have tried and what you expected to happen.
            </li>
            <li>Review your question and post it to the site.</li>
          </ul>
        </div>

        {/* Question Form */}
        <form onSubmit={handleSubmit} className={classes.form}>
          <input
            ref={titleRef}
            type="text"
            placeholder="Question title"
            required
          />
          <textarea
            ref={descriptionRef}
            rows={4}
            placeholder="Question description..."
            required
          />
          <button type="submit" className={classes.submitButton}>
            Post Question
          </button>
        </form>
      </div>
    </Layout>
  );
}

export default AskQuestion;
