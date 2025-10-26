import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { Link } from 'react-router-dom';
import { FaUserPlus, FaQuestion, FaLightbulb, FaUsers } from 'react-icons/fa';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import styles from './HowItWorks.module.css';

function HowItWorks() {
  const { isDarkMode } = useTheme();

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
      },
    },
  };

  const steps = [
    {
      title: 'Create an Account',
      description: 'Sign up for free and join our community of learners and experts.',
      icon: <FaUserPlus className={styles.icon} />,
      color: '#4f46e5',
    },
    {
      title: 'Ask Questions',
      description: 'Post your questions and get help from our community members.',
      icon: <FaQuestion className={styles.icon} />,
      color: '#8b5cf6',
    },
    {
      title: 'Get Answers',
      description: 'Receive detailed answers and explanations from experts.',
      icon: <FaLightbulb className={styles.icon} />,
      color: '#ec4899',
    },
    {
      title: 'Engage & Learn',
      description: 'Vote, comment, and participate in discussions to enhance your learning.',
      icon: <FaUsers className={styles.icon} />,
      color: '#10b981',
    },
  ];

  return (
    <div className={styles.pageContainer}>
      <Header />
      <div className={`${styles.container} ${isDarkMode ? styles.dark : styles.light}`}>
        <div className={styles.hero}>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            How <span className={styles.highlight}>Evangadi Forum</span> Works
          </motion.h1>
          <motion.p 
            className={styles.subtitle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Join thousands of learners and experts in our growing community
          </motion.p>
        </div>

        <motion.div 
          className={styles.stepsContainer}
          initial="hidden"
          animate="visible"
        >
          {steps.slice(0, 3).map((step, index) => (
            <motion.div
              key={index}
              className={`${styles.stepCard} ${isDarkMode ? styles.darkCard : ''}`}
              variants={itemVariants}
              transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
              whileHover={{ 
                y: -10,
                boxShadow: isDarkMode 
                  ? `0 15px 30px ${step.color}33` 
                  : `0 15px 30px ${step.color}22`
              }}
            >
              <div 
                className={styles.stepIcon}
                style={{
                  background: isDarkMode ? `${step.color}22` : `${step.color}11`,
                  border: `2px solid ${step.color}44`,
                }}
              >
                {step.icon}
              </div>
              <h3 style={{ color: step.color }}>{step.title}</h3>
              <p>{step.description}</p>
              <div 
                className={styles.stepNumber}
                style={{ color: step.color }}
              >
                {index + 1}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className={styles.bottomRow}>
          <motion.div
            className={`${styles.stepCard} ${isDarkMode ? styles.darkCard : ''} ${styles.engageCard}`}
            variants={itemVariants}
            transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
            whileHover={{ 
              y: -10,
              boxShadow: isDarkMode 
                ? '0 15px 30px rgba(16, 185, 129, 0.2)' 
                : '0 15px 30px rgba(16, 185, 129, 0.13)'
            }}
          >
            <div 
              className={styles.stepIcon}
              style={{
                background: isDarkMode ? 'rgba(16, 185, 129, 0.13)' : 'rgba(16, 185, 129, 0.07)',
                border: '2px solid rgba(16, 185, 129, 0.27)',
              }}
            >
              <FaUsers className={styles.icon} />
            </div>
            <h3 style={{ color: '#10b981' }}>Engage & Learn</h3>
            <p>Vote, comment, and participate in discussions to enhance your learning.</p>
            <div 
              className={styles.stepNumber}
              style={{ color: '#10b981' }}
            >
              4
            </div>
          </motion.div>

          <motion.div 
            className={`${styles.ctaSection} ${isDarkMode ? styles.darkCard : ''}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2>Ready to Get Started?</h2>
            <p>Join our community today and start your learning journey</p>
            <Link to="/auth" className={styles.ctaLink}>
              <motion.span 
                className={styles.ctaButton}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started
              </motion.span>
            </Link>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default HowItWorks;
