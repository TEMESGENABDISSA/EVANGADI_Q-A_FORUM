import { useEffect, useState, useContext } from "react";
import styles from "./questions.module.css";
import { axiosInstance } from "../../utility/axios.js";
import QuestionCard from "../../components/QuestionCard/QuestionCard.jsx";
import Loader from "../../components/Loader/Loader.jsx";
import { UserState } from "../../App.jsx";

function Question() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 5; // Number of questions per page
  const { user } = useContext(UserState);

  // Fetch all questions
  useEffect(() => {
    setLoading(true);
    axiosInstance.get("/questions").then((res) => {
      setQuestions(res.data.message);
      setLoading(false);
    });
  }, []);

  // Filter questions based on search query
  const filteredQuestions = questions.filter((question) => {
    const titleMatches = question.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const descriptionMatches = question.description
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return titleMatches || descriptionMatches;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);
  const startIndex = (currentPage - 1) * questionsPerPage;
  const currentQuestions = filteredQuestions.slice(
    startIndex,
    startIndex + questionsPerPage
  );

  // Group questions into 2 per row
  const groupedQuestions = [];
  for (let i = 0; i < currentQuestions.length; i += 2) {
    groupedQuestions.push(currentQuestions.slice(i, i + 2));
  }

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
    <div className={styles.container}>
      {/* Search input */}
      <div className={styles.search_question}>
        <input
          type="text"
          placeholder="Search for a question"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1); // Reset to first page on new search
          }}
        />
      </div>

      <hr />
      <h1 className={styles.title}>Questions</h1>

      {loading ? (
        <Loader />
      ) : filteredQuestions.length === 0 ? (
        <div className={styles.no_questions}>
          <p>No Questions Found</p>
        </div>
      ) : (
        <>
          <div className={styles.questions_wrapper}>
            {groupedQuestions.map((group, index) => (
              <div
                key={index}
                className={
                  group.length === 2
                    ? styles.questions_grid
                    : styles.single_question_wrapper
                }
              >
                {group.map((question) => (
                  <QuestionCard
                    key={question.questionid}
                    id={question.questionid}
                    userName={question.username}
                    questionTitle={question.title}
                    description={question.description}
                    question_date={question.createdAt}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Pagination Buttons */}
          {filteredQuestions.length > questionsPerPage && (
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
        </>
      )}
    </div>
  );
}

export default Question;
