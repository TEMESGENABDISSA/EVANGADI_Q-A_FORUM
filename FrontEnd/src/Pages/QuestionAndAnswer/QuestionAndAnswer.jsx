import { useContext, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { axiosInstance } from "../../utility/axios.js";
import Layout from "../../Layout/Layout.jsx";
import styles from "./answer.module.css";
import { MdAccountCircle } from "react-icons/md";
import { FaClipboardQuestion } from "react-icons/fa6";
import { MdOutlineQuestionAnswer } from "react-icons/md";
import {
  FaThumbsUp,
  FaThumbsDown,
  FaEdit,
  FaTrash,
  FaCheck,
} from "react-icons/fa";
import moment from "moment";
import { UserState } from "../../App.jsx";
import { LuCalendarClock } from "react-icons/lu";
import Swal from "sweetalert2";
import { useTheme } from "../../context/ThemeContext";

function QuestionAndAnswer() {
  const [questionDetails, setQuestionDetails] = useState({});
  const { user } = useContext(UserState);
  const userId = user?.userid;
  const { isDarkMode } = useTheme();
  const { questionId } = useParams();
  const [loading, setLoading] = useState(true);
  const [expandedAnswer, setExpandedAnswer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [userVotes, setUserVotes] = useState({}); // Track user's votes
  const [editingAnswer, setEditingAnswer] = useState(null); // Track which answer is being edited
  const [editingQuestion, setEditingQuestion] = useState(false); // Track if question is being edited
  const [editFormData, setEditFormData] = useState({}); // Store edit form data
  const answersPerPage = 5;
  const answerInput = useRef();

  // Fetch the question details
  useEffect(() => {
    axiosInstance.get(`/question/${questionId}`).then((res) => {
      setQuestionDetails(res.data);
      setLoading(false);

      // Increment view count
      axiosInstance.post(`/question/${questionId}/view`).catch((err) => {
        console.error("Failed to increment view count:", err);
      });
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

  // Handle editing an answer
  async function handleEditAnswer() {
    const { answer } = editFormData;

    if (!answer) {
      Swal.fire({
        title: "Error",
        text: "Answer content is required",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    try {
      const response = await axiosInstance.put("/answer", {
        answerid: editingAnswer,
        userid: userId,
        answer: answer,
      });

      if (response.status === 200) {
        Swal.fire({
          title: "Success!",
          text: "Answer updated successfully!",
          icon: "success",
          confirmButtonText: "OK",
        });
        setEditingAnswer(null);
        setEditFormData({});
        // Refresh the question
        const res = await axiosInstance.get(`/question/${questionId}`);
        setQuestionDetails(res.data);
      }
    } catch (error) {
      console.error("Error editing answer:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to update answer. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  }

  // Handle deleting an answer
  async function handleDeleteAnswer(answerId) {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const response = await axiosInstance.delete("/answer", {
          data: {
            answerid: answerId,
            userid: userId,
          },
        });

        if (response.status === 200) {
          Swal.fire({
            title: "Deleted!",
            text: "Your answer has been deleted.",
            icon: "success",
            confirmButtonText: "OK",
          });
          // Refresh the question
          const res = await axiosInstance.get(`/question/${questionId}`);
          setQuestionDetails(res.data);
        }
      } catch (error) {
        console.error("Error deleting answer:", error);
        Swal.fire({
          title: "Error",
          text: "Failed to delete answer. Please try again.",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    }
  }

  // Handle editing a question
  async function handleEditQuestion() {
    const { title, description, tag } = editFormData;

    if (!title || !description) {
      Swal.fire({
        title: "Error",
        text: "Title and description are required",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    try {
      const response = await axiosInstance.put("/question", {
        questionid: questionId,
        userid: userId,
        title: title,
        description: description,
        tag: tag || "General",
      });

      if (response.status === 200) {
        Swal.fire({
          title: "Success!",
          text: "Question updated successfully!",
          icon: "success",
          confirmButtonText: "OK",
        });
        setEditingQuestion(false);
        setEditFormData({});
        // Refresh the question
        const res = await axiosInstance.get(`/question/${questionId}`);
        setQuestionDetails(res.data);
      }
    } catch (error) {
      console.error("Error editing question:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to update question. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  }

  // Start editing question
  function startEditQuestion() {
    setEditFormData({
      title: questionDetails?.title || "",
      description: questionDetails?.description || "",
      tag: questionDetails?.tag || "General",
    });
    setEditingQuestion(true);
  }

  // Start editing answer
  function startEditAnswer(answerId, currentAnswer) {
    setEditFormData({
      answer: currentAnswer || "",
    });
    setEditingAnswer(answerId);
  }

  // Handle marking answer as accepted
  async function handleMarkAsAccepted(answerId) {
    try {
      const response = await axiosInstance.post("/answer/accept", {
        answerid: answerId,
        questionid: questionId,
        userid: userId,
      });

      if (response.status === 200) {
        Swal.fire({
          title: "Success!",
          text: "Answer marked as accepted!",
          icon: "success",
          confirmButtonText: "OK",
        });
        // Refresh the question
        const res = await axiosInstance.get(`/question/${questionId}`);
        setQuestionDetails(res.data);
      }
    } catch (error) {
      console.error("Error marking answer as accepted:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to mark answer as accepted. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  }

  // Handle deleting a question
  async function handleDeleteQuestion() {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will delete the question and all its answers!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const response = await axiosInstance.delete("/question", {
          data: {
            questionid: questionId,
            userid: userId,
          },
        });

        if (response.status === 200) {
          Swal.fire({
            title: "Deleted!",
            text: "Your question has been deleted.",
            icon: "success",
            confirmButtonText: "OK",
          }).then(() => {
            window.location.href = "/home";
          });
        }
      } catch (error) {
        console.error("Error deleting question:", error);
        Swal.fire({
          title: "Error",
          text: "Failed to delete question. Please try again.",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    }
  }

  // Handle voting on answers
  async function handleVote(answerId, voteType) {
    if (!userId) {
      Swal.fire({
        title: "Login Required",
        text: "Please log in to vote on answers.",
        icon: "info",
        confirmButtonText: "OK",
      });
      return;
    }

    try {
      const response = await axiosInstance.post("/answer/vote", {
        answerid: answerId,
        userid: userId,
        voteType: voteType,
      });

      if (response.status === 200 || response.status === 201) {
        // Update local vote state
        setUserVotes((prev) => ({
          ...prev,
          [answerId]: prev[answerId] === voteType ? null : voteType,
        }));

        // Refresh the question to get updated vote counts
        const res = await axiosInstance.get(`/question/${questionId}`);
        setQuestionDetails(res.data);
      }
    } catch (error) {
      console.error("Voting error:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to vote. Please try again.",
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

  if (loading) {
    return (
      <Layout>
        <div className={`${styles.container} ${isDarkMode ? styles.dark : styles.light}`}>
          <div className={styles.mainContainer}>
            <p>Loading question...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`${styles.container} ${isDarkMode ? styles.dark : styles.light}`}>
        <div className={styles.mainContainer}>
          <Link to="/" className={styles.backButton}>
            ← Back to Questions
          </Link>
          
          <div className={styles.questionInfo}>
            <div className={styles.questionHeader}>
              <FaClipboardQuestion size={35} className={styles.questionIcon} />
              <div className={styles.questionContent}>
                <h1 className={styles.questionTitle}>
                  {questionDetails?.title}
                </h1>
                <p className={styles.questionDescription}>
                  {questionDetails?.description}
                </p>
              </div>
            </div>
            
            <p className={styles.question_date}>
              Asked by:
              <span style={{ fontWeight: "600" }}>
                @{questionDetails?.qtn_username}
              </span>
              <br />
              <LuCalendarClock size={19} style={{ marginRight: "5px" }} />
              {moment(questionDetails?.qtn_createdAt)
                .format("ddd, MMM DD, YYYY h:mm A")
                .toUpperCase()}
              <br />
              <span className={styles.viewCount}>
                👁️ {questionDetails?.view_count || 0} views
              </span>
            </p>

            {/* Question Actions - only show if user owns the question */}
            {userId &&
              questionDetails?.qtn_username === user?.username &&
              !editingQuestion && (
                <div className={styles.questionActions}>
                  <button
                    className={styles.actionButton}
                    onClick={startEditQuestion}
                    title="Edit question"
                  >
                    <FaEdit />
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    onClick={handleDeleteQuestion}
                    title="Delete question"
                  >
                    <FaTrash />
                  </button>
                </div>
              )}
          </div>

          {/* Question Edit Form */}
          {editingQuestion && (
            <div className={styles.editForm}>
              <h3>Edit Question</h3>
              <div className={styles.formGroup}>
                <label>Title:</label>
                <input
                  type="text"
                  value={editFormData.title || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, title: e.target.value })
                  }
                  className={styles.formInput}
                  maxLength={200}
                />
                <div className={styles.charCounter}>
                  {editFormData.title?.length || 0}/200
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Description:</label>
                <textarea
                  value={editFormData.description || ""}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      description: e.target.value,
                    })
                  }
                  className={styles.formTextarea}
                  maxLength={2000}
                  rows={6}
                />
                <div className={styles.charCounter}>
                  {editFormData.description?.length || 0}/2000
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Tag:</label>
                <select
                  value={editFormData.tag || "General"}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, tag: e.target.value })
                  }
                  className={styles.formSelect}
                >
                  <option value="General">General</option>
                  <option value="React">React</option>
                  <option value="JavaScript">JavaScript</option>
                  <option value="Python">Python</option>
                  <option value="Node.js">Node.js</option>
                  <option value="HTML/CSS">HTML/CSS</option>
                  <option value="Database">Database</option>
                  <option value="API">API</option>
                  <option value="Bug Fix">Bug Fix</option>
                  <option value="Best Practice">Best Practice</option>
                  <option value="Tutorial">Tutorial</option>
                  <option value="Performance">Performance</option>
                  <option value="Security">Security</option>
                  <option value="Deployment">Deployment</option>
                </select>
              </div>
              <div className={styles.formActions}>
                <button
                  onClick={handleEditQuestion}
                  className={styles.saveButton}
                  disabled={!editFormData.title || !editFormData.description}
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditingQuestion(false);
                    setEditFormData({});
                  }}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

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
              <div
                key={answer?.answerid}
                className={`${styles.answer_holder} ${
                  answer?.is_accepted ? styles.acceptedAnswer : ""
                }`}
              >
                <div className={styles.account_holder}>
                  <MdAccountCircle size={50} />
                  <div className={styles.profileName}>@{answer?.username}</div>
                  {answer?.is_accepted && (
                    <div className={styles.acceptedBadge}>
                      ✅ Accepted Answer
                    </div>
                  )}
                </div>
                <div className={styles.answerContent}>
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
                      <LuCalendarClock
                        size={19}
                        style={{ marginRight: "5px" }}
                      />
                      {moment(answer?.createdAt)
                        .format("ddd, MMM DD, YYYY h:mm A")
                        .toUpperCase()}
                    </p>
                  </div>

                  {/* Voting Section */}
                  <div className={styles.votingSection}>
                    <div className={styles.voteCount}>
                      {answer?.vote_count || 0} votes
                    </div>
                    <div className={styles.voteButtons}>
                      <button
                        className={`${styles.voteButton} ${styles.upvote} ${
                          userVotes[answer?.answerid] === "up"
                            ? styles.active
                            : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVote(answer?.answerid, "up");
                        }}
                        disabled={!userId}
                        title={userId ? "Upvote this answer" : "Login to vote"}
                      >
                        <FaThumbsUp />
                      </button>
                      <button
                        className={`${styles.voteButton} ${styles.downvote} ${
                          userVotes[answer?.answerid] === "down"
                            ? styles.active
                            : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVote(answer?.answerid, "down");
                        }}
                        disabled={!userId}
                        title={
                          userId ? "Downvote this answer" : "Login to vote"
                        }
                      >
                        <FaThumbsDown />
                      </button>

                      {/* Accept Answer Button - only show if user owns the question */}
                      {userId &&
                        questionDetails?.qtn_username === user?.username && (
                          <button
                            className={`${styles.voteButton} ${
                              answer?.is_accepted
                                ? styles.acceptedButton
                                : styles.acceptButton
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsAccepted(answer?.answerid);
                            }}
                            title={
                              answer?.is_accepted
                                ? "Unmark as accepted"
                                : "Mark as accepted answer"
                            }
                          >
                            <FaCheck />
                          </button>
                        )}

                      {/* Answer Actions - only show if user owns the answer */}
                      {userId && answer?.username === user?.username && (
                        <>
                          <button
                            className={`${styles.voteButton} ${styles.editButton}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditAnswer(answer?.answerid, answer?.answer);
                            }}
                            title="Edit answer"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className={`${styles.voteButton} ${styles.deleteButton}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAnswer(answer?.answerid);
                            }}
                            title="Delete answer"
                          >
                            <FaTrash />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className={styles.noAnswerText}>
              <span>No answers yet!</span> <br />
              Be the first to contribute your answer and help the community.
            </p>
          )}

          {/* Answer Edit Form */}
          {editingAnswer && (
            <div className={styles.editForm}>
              <h3>Edit Answer</h3>
              <div className={styles.formGroup}>
                <label>Answer:</label>
                <textarea
                  value={editFormData.answer || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, answer: e.target.value })
                  }
                  className={styles.formTextarea}
                  rows={6}
                  placeholder="Write your answer here..."
                />
              </div>
              <div className={styles.formActions}>
                <button
                  onClick={handleEditAnswer}
                  className={styles.saveButton}
                  disabled={!editFormData.answer}
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditingAnswer(null);
                    setEditFormData({});
                  }}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </div>
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
                onChange={(e) => {
                  // Content change handler
                  const content = e.target.value;
                }}
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
