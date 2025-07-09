import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import supabase from "../SupabaseClient"
import Navbar from "../Components/common/Navbar"
import Footer from "../Components/common/Footer"

export default function ExamAttempt() {
  const { id: examId } = useParams()
  const navigate = useNavigate()

  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [exam, setExam] = useState(null)
  const [timeLeft, setTimeLeft] = useState(5400) // 90 minutes in seconds
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const videoRef = useRef()
  const mediaRecorderRef = useRef()
  const screenChunks = useRef([])

  // Format time as HH:MM:SS
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0')
    }
  }
  
  const { hours, minutes, seconds } = formatTime(timeLeft)

  // Fetch questions and exam data
  useEffect(() => {
    const loadExam = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        console.log('Fetching exam data for ID:', examId)
        
        // Fetch the exam which includes questions as JSONB
        const { data: examData, error: examError } = await supabase
          .from("exams")
          .select("*")
          .eq("id", examId)
          .single()
        
        if (examError) throw examError
        
        console.log('Exam data loaded:', examData)
        setExam(examData)
        
        // Parse the questions from the JSONB column
        if (examData.questions && Array.isArray(examData.questions)) {
          // Format the questions data
          const formattedQuestions = examData.questions.map((q, index) => ({
            id: q.id || `q-${index}`, // Use question ID or generate a temporary one
            question_text: q.question_text || '',
            options: [
              q.option_a,
              q.option_b,
              q.option_c,
              q.option_d
            ].filter(Boolean), // Remove any null/undefined options
            correct_answer: q.correct_answer,
            marks: q.marks || 1
          }))
          
          console.log('Formatted questions:', formattedQuestions)
          setQuestions(formattedQuestions)
          
          // Initialize answers object with empty strings
          const initialAnswers = {}
          formattedQuestions.forEach(q => {
            initialAnswers[q.id] = ''
          })
          setAnswers(initialAnswers)
          
          // Set the exam duration in seconds
          setTimeLeft((examData.duration_minutes || 90) * 60)
        } else {
          setError('No questions found in this exam. Please contact your instructor.')
        }
      } catch (error) {
        console.error('Error in loadExam:', error)
        setError('Failed to load exam. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }
    
    const setupWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' },
          audio: false
        })
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch (err) {
        console.error("Error accessing webcam:", err)
      }
    }

    loadExam()
    setupWebcam()
    
    // Cleanup function
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop())
      }
    }
  }, [examId])

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit()
      return
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)
    
    return () => clearInterval(timer)
  }, [timeLeft])

  const handleOptionChange = (questionId, selectedOption) => {
    setAnswers(prevAnswers => ({
      ...prevAnswers,
      [questionId]: selectedOption
    }))
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else if (currentQuestionIndex === questions.length - 1) {
      handleSubmit()
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      // Stop any recording
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      
      // Submit answers to Supabase
      const { error } = await supabase
        .from('exam_attempts')
        .insert([{
          exam_id: examId,
          student_id: (await supabase.auth.getUser()).data.user.id,
          answers: answers,
          submitted_at: new Date().toISOString(),
          score: 0 // Calculate score if needed
        }])
      
      if (error) throw error
      
      navigate('/exam/submitted')
    } catch (error) {
      console.error("Error submitting exam:", error)
      alert("There was an error submitting your exam. Please try again.")
      setIsSubmitting(false)
    }
  }

  const currentQuestion = questions[currentQuestionIndex] || {}
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exam...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Error Loading Exam</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!exam || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
          <div className="text-yellow-500 text-4xl mb-4">ℹ️</div>
          <h2 className="text-xl font-semibold mb-2">No Questions Available</h2>
          <p className="text-gray-600 mb-6">This exam doesn't have any questions yet. Please contact your instructor.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="exam-interface">
      {/* Header */}
      <header className="exam-header">
        <div className="exam-header-content">
          <div className="exam-title-container">
            <h1 className="exam-title">
              {exam?.title || 'Exam'}
              <span className="question-counter">Question {currentQuestionIndex + 1} of {questions.length}</span>
            </h1>
          </div>
          <div className="flex items-center">
            <div className="timer">
              <span>Time Left:</span>
              <span className="timer-value">{hours}:{minutes}:{seconds}</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="submit-btn"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          </div>
        </div>
      </header>

      <div className="exam-container">
        {/* Questions Section */}
        <div className="question-section">
          {currentQuestion && (
            <>
              <h2 className="question-text">
                {currentQuestion.question_text}
              </h2>
              
              <div className="options-grid">
                {currentQuestion.options?.map((option, index) => {
                  const optionLetter = String.fromCharCode(65 + index)
                  return (
                    <div
                      key={index}
                      onClick={() => handleOptionChange(currentQuestion.id, optionLetter)}
                      className={`option ${answers[currentQuestion.id] === optionLetter ? 'selected' : ''}`}
                    >
                      <div className="option-letter">{optionLetter}</div>
                      <div className="option-text">
                        {option}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="nav-buttons">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="nav-btn"
                >
                  Previous
                </button>
                <button
                  onClick={handleNextQuestion}
                  disabled={!answers[currentQuestion.id]}
                  className="nav-btn next"
                >
                  {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Webcam & Navigation */}
        <div className="webcam-section">
          <div className="webcam-container">
            <h3 className="webcam-header">Webcam</h3>
            
            <div className="webcam-feed">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="webcam-overlay">
                <div className="webcam-circle"></div>
                <p className="webcam-status">Webcam is active</p>
              </div>
            </div>

            <div className="note-banner">
              Note: Your webcam is being recorded for proctoring purposes. Please ensure your face is clearly visible.
            </div>

            <h4 className="font-medium text-gray-700 mb-3">Questions</h4>
            <div className="questions-grid">
              {questions.map((q, index) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`question-number ${
                    answers[q.id]
                      ? 'answered'
                      : index === currentQuestionIndex
                      ? 'current'
                      : ''
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <div className="legend">
              <div className="legend-item">
                <span className="legend-dot answered"></span>
                <span>Answered</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot current"></span>
                <span>Current</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot unanswered"></span>
                <span>Unanswered</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
