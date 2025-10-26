import styles from "./questionCard.module.css";
import { MdAccountCircle } from "react-icons/md";
import { FaChevronRight } from "react-icons/fa6";
import { FaCheckCircle, FaComments, FaEye } from "react-icons/fa";
import { Link } from "react-router-dom";
import moment from "moment";
import { LuCalendarClock } from "react-icons/lu";
import { useState, useEffect } from "react";
import { axiosInstance } from "../../utility/axios";

function QuestionCard({
  id,
  userName,
  questionTitle,
  description,
  question_date,
}) {
  const [answerCount, setAnswerCount] = useState(0);
  const [hasAnswers, setHasAnswers] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  
  // Character limits
  const MAX_TITLE_LENGTH = 60;
  const MAX_DESCRIPTION_LENGTH = 120;

  // Format large numbers (e.g., 1.2k, 10k)
  const formatCount = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  useEffect(() => {
    // Fetch answer count and view count for this question
    const fetchQuestionData = async () => {
      try {
        // Fetch answer count
        const answerResponse = await axiosInstance.get(`/answer/${id}`);
        const count = answerResponse.data.rows?.length || 0;
        setAnswerCount(count);
        setHasAnswers(count > 0);
        
        // Fetch question details for view count
        const questionResponse = await axiosInstance.get(`/question/${id}`);
        setViewCount(questionResponse.data.view_count || 0);
      } catch (error) {
        console.error('Error fetching question data:', error);
      }
    };

    if (id) {
      fetchQuestionData();
    }
  }, [id]);
  
  const formattedDate = moment(question_date)
    .format("ddd, MMM DD, YYYY h:mm A")
    .toUpperCase();

  return (
    <Link
      to={`/question/${id}`}
      style={{ textDecoration: "none", color: "black" }}
    >
      <div className={styles.question_holder}>
        <div className={styles.requester_question_holder}>
          <div className={styles.requester_holder}>
            <MdAccountCircle size={35} color="#FE9119" />
            <div className={styles.username}>@{userName}</div>
          </div>

          <div className={styles.title_description_holder}>
            <div className={styles.titleWithBadge}>
              <p className={styles.question_title}>
                {String(questionTitle).length > MAX_TITLE_LENGTH
                  ? String(questionTitle).substring(0, MAX_TITLE_LENGTH).concat("…")
                  : questionTitle}
              </p>
              {hasAnswers ? (
                <span className={styles.answerBadge} title={`${answerCount} ${answerCount === 1 ? 'answer' : 'answers'}`}>
                  <FaCheckCircle className={styles.answerIcon} />
                  {formatCount(answerCount)} {answerCount === 1 ? 'Answer' : 'Answers'}
                </span>
              ) : (
                <span className={styles.noAnswerBadge} title="No answer">
                  <FaComments className={styles.noAnswerIcon} />
                  No Answer
                </span>
              )}
            </div>
            <p className={styles.question_description}>
              {String(description).length > MAX_DESCRIPTION_LENGTH
                ? String(description).substring(0, MAX_DESCRIPTION_LENGTH).concat("…")
                : description}
            </p>
            <div className={styles.questionMeta}>
              <p className={styles.question_date}>
                <LuCalendarClock
                  style={{
                    marginRight: "5px",
                    color: "#FE9119",
                    fontSize: "16px",
                  }}
                />
                {formattedDate}
              </p>
              {answerCount > 0 && (
                <span className={styles.answerCountBadge} title={`${answerCount} ${answerCount === 1 ? 'answer' : 'answers'}`}>
                  <FaComments className={styles.commentIcon} />
                  {formatCount(answerCount)}
                </span>
              )}
              {viewCount > 0 && (
                <span className={styles.viewCountBadge} title={`${viewCount} ${viewCount === 1 ? 'view' : 'views'}`}>
                  <FaEye className={styles.eyeIcon} />
                  {formatCount(viewCount)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.question_arrow_holder}>
          <FaChevronRight size={18} color="#FE9119" />
        </div>
      </div>
    </Link>
  );
}

export default QuestionCard;
