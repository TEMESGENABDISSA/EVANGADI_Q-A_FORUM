import { useContext, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { axiosInstance } from "../../utility/axios.js";
import Layout from "../../Layout/Layout.jsx";
import styles from "./answer.module.css";
import { MdAccountCircle } from "react-icons/md";
import { FaClipboardQuestion } from "react-icons/fa6";
import { MdOutlineQuestionAnswer } from "react-icons/md";
import moment from "moment";
import { UserState } from "../../App.jsx";
import { LuCalendarClock } from "react-icons/lu";
import Swal from "sweetalert2";

function QuestionAndAnswer() {
  const [questionDetails, setQuestionDetails] = useState({});
  const { user } = useContext(UserState);
  const userId = user?.userid;
  const { questionId } = useParams();
  const [loading, setLoading] = useState(true);
  const [expandedAnswer, setExpandedAnswer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const answersPerPage = 5;
  const answerInput = useRef();

  // Fetch the question details
  useEffect(() => {
    axiosInstance.get(`/question/${questionId}`).then((res) => {
      setQuestionDetails(res.data);
      setLoading(false);
    });
  }, [questionId]);

  // Post a new answer to the question
  async function handlePostAnswer(e) {
    e.preventDefault();
    const response = await axiosInstance.post("/answer", {
      userid: userId,
      answer: answerInput.current.value,
      questionid: questionId,
    });
    try {
      if (response.status === 201) {
        Swal.fire({
          title: "Success!",
          text: "Answer submitted successfully!",
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => window.location.reload());
      } else {
        Swal.fire({
          title: "Error",
          text: "Failed to post answer",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "Failed to post answer. Please try again later.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  }

  // Truncate text after 50 words
  const truncateText = (text, limit = 50) => {
    if (!text) return "";
    const words = text.split(" ");
    if (words.length > limit) {
      return (
        <>
          {words.slice(0, limit).join(" ")}{" "}
          <span
            style={{ color: "var(--blue-shade)", cursor: "pointer" }}
            onClick={() => toggleExpandAnswer(null)}
          >
            ... See More
          </span>
        </>
      );
    }
    return text;
  };

  // Toggle expand/collapse
  const toggleExpandAnswer = (answerId) => {
    setExpandedAnswer(expandedAnswer === answerId ? null : answerId);
  };

  // Pagination logic
  const totalAnswers = questionDetails?.answers?.length || 0;
  const totalPages = Math.ceil(totalAnswers / answersPerPage);
  const startIndex = (currentPage - 1) * answersPerPage;
  const currentAnswers = questionDetails?.answers?.slice(
    startIndex,
    startIndex + answersPerPage
  );

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.mainContainer}>
          <div className={styles.questionHeader}>
            <FaClipboardQuestion size={35} className={styles.questionIcon} />
            <div>
              <h1 className={styles.questionTitle}>{questionDetails?.title}</h1>
              <p className={styles.questionDescription}>
                {questionDetails?.description}
              </p>
              <p className={styles.question_date}>
                Asked by:
                <span style={{ fontWeight: "600" }}>
                  {" "}
                  @{questionDetails?.qtn_username}{" "}
                </span>{" "}
                <br />
                <LuCalendarClock size={19} style={{ marginRight: "5px" }} />
                {moment(questionDetails.qtn_createdAt)
                  .format("ddd, MMM DD, YYYY h:mm A")
                  .toUpperCase()}
              </p>
            </div>
          </div>

          <h2 className={styles.answerHeader}>
            <MdOutlineQuestionAnswer
              size={30}
              style={{ marginRight: "10px" }}
            />
            Answers From the Community:
          </h2>

          {/* Display Answers */}
          {currentAnswers?.length > 0 ? (
            currentAnswers.map((answer) => (
              <div key={answer?.answerid} className={styles.answer_holder}>
                <div className={styles.account_holder}>
                  <MdAccountCircle size={50} />
                  <div className={styles.profileName}>@{answer?.username}</div>
                </div>
                <div
                  className={styles.answerTextContainer}
                  onClick={() => toggleExpandAnswer(answer?.answerid)}
                >
                  <p className={styles.answerText}>
                    {expandedAnswer === answer?.answerid
                      ? answer?.answer
                      : truncateText(answer?.answer)}
                  </p>
                  <p className={styles.answer_date}>
                    <LuCalendarClock size={19} style={{ marginRight: "5px" }} />
                    {moment(answer?.createdAt)
                      .format("ddd, MMM DD, YYYY h:mm A")
                      .toUpperCase()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className={styles.noAnswerText}>
              <span>No answers yet!</span> <br />
              Be the first to contribute your answer and help the community.
            </p>
          )}

          {/* Pagination Buttons */}
          {totalPages > 1 && (
            <div className={styles.paginationContainer}>
              <button
                className={styles.paginationButton}
                onClick={handlePrev}
                disabled={currentPage === 1}
              >
                ← Previous
              </button>
              <span className={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className={styles.paginationButton}
                onClick={handleNext}
                disabled={currentPage === totalPages}
              >
                Next →
              </button>
            </div>
          )}

          {/* Post New Answer Form */}
          <section className={styles.answerFormSection}>
            <h3 className={styles.answerFormTitle}>Answer The Top Question</h3>
            <Link to="/" className={styles.questionPageLink}>
              Go to Question page
            </Link>
            <form onSubmit={handlePostAnswer}>
              <textarea
                placeholder="Your Answer..."
                className={styles.answerInput}
                required
                ref={answerInput}
              />
              <button className={styles.postAnswerButton} type="submit">
                Post Your Answer
              </button>
            </form>
          </section>
        </div>
      </div>
    </Layout>
  );
}

export default QuestionAndAnswer;
