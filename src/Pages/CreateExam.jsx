import { useState, useEffect } from "react"
import supabase from "../SupabaseClient"
import { useNavigate } from "react-router-dom"
import Navbar from "../Components/Navbar"
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Sample JSON structure for reference
const SAMPLE_QUESTIONS = [
  {
    "question": "What is the capital of France?",
    "type": "mcq",
    "optionA": "London",
    "optionB": "Paris",
    "optionC": "Berlin",
    "optionD": "Madrid",
    "correct_answer": "B"
  },
  {
    "question": "Explain the concept of React hooks",
    "type": "answerable",
    "correct_answer": "React Hooks are functions that let you use state and other React features without writing classes."
  }
]

const styles = `
  .create-exam-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .import-export-section {
    margin: 20px 0;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
  }
  
  .json-import-container {
    margin-top: 15px;
  }
  
  .json-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  }
  
  .json-textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-family: monospace;
    font-size: 14px;
    resize: vertical;
    min-height: 200px;
  }
  
  .json-format-hint {
    margin-top: 15px;
    background: #f0f8ff;
    padding: 15px;
    border-radius: 4px;
    font-size: 14px;
  }
  
  .json-format-hint pre {
    background: #fff;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
  }
  
  .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
  }
  
  .btn-import {
    background: #4CAF50;
    color: white;
  }
  
  .btn-import:hover {
    background: #45a049;
  }
  
  .btn-sample {
    background: #2196F3;
    color: white;
  }
  
  .btn-sample:hover {
    background: #0b7dda;
  }
  
  .btn-primary {
    background: #4CAF50;
    color: white;
  }
  
  .btn-primary:hover {
    background: #45a049;
  }
`

// Add styles to the document
const styleElement = document.createElement('style')
styleElement.textContent = styles
document.head.appendChild(styleElement)

export default function CreateExam() {
  const [title, setTitle] = useState("")
  const [subject, setSubject] = useState("")
  const [duration, setDuration] = useState(60)
  const [email, setEmail] = useState("")
  const [instructions, setInstructions] = useState("")
  const [questions, setQuestions] = useState([
    { question: "", type: "text", options: [], answer: "" },
  ])

  const navigate = useNavigate()
  const [showJsonInput, setShowJsonInput] = useState(false)
  const [jsonInput, setJsonInput] = useState('')

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { question: "", type: "mcq", optionA: "", optionB: "", optionC: "", optionD: "", correct_answer: "A" },
    ])
  }

  const handleJsonImport = () => {
    try {
      if (!jsonInput.trim()) {
        showToast('Please enter JSON data', 'error')
        return
      }
      
      const parsedQuestions = JSON.parse(jsonInput)
      if (!Array.isArray(parsedQuestions)) {
        throw new Error('JSON should be an array of questions')
      }

      // Validate each question
      const validatedQuestions = parsedQuestions.map((q, index) => {
        if (!q.question) {
          throw new Error(`Question at index ${index} is missing 'question' field`)
        }
        if (!q.type || !['mcq', 'answerable'].includes(q.type)) {
          throw new Error(`Question at index ${index} has invalid type. Must be 'mcq' or 'answerable'`)
        }
        if (q.type === 'mcq') {
          if (!q.optionA || !q.optionB || !q.optionC || !q.optionD) {
            throw new Error(`MCQ question at index ${index} is missing options`)
          }
          if (!q.correct_answer || !['A', 'B', 'C', 'D'].includes(q.correct_answer)) {
            throw new Error(`MCQ question at index ${index} has invalid correct answer`)
          }
        } else {
          if (!q.correct_answer) {
            throw new Error(`Answerable question at index ${index} is missing correct_answer`)
          }
        }
        return q
      })

      setQuestions(validatedQuestions)
      setShowJsonInput(false)
      setJsonInput('')
      showToast(`Successfully imported ${validatedQuestions.length} questions`, 'success')
    } catch (error) {
      console.error('Error parsing JSON:', error)
      showToast(`Invalid JSON: ${error.message}`, 'error')
    }
  }

  const handleQuestionChange = (i, field, value) => {
    const updated = [...questions]
    updated[i][field] = value
    setQuestions(updated)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const user = await supabase.auth.getUser()
    const userId = user.data?.user?.id

    const { error } = await supabase.from("exams").insert([
      {
        title,
        subject,
        duration_minutes: duration,
        support_email: email,
        instructions,
        questions,
        created_by: userId,
      },
    ])

    if (error) {
      alert("Error: " + error.message)
    } else {
      alert("Exam created!")
      navigate("/admin/dashboard")
    }
  }

  // Toast notification configuration
  const showToast = (message, type = 'info') => {
    switch(type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'warning':
        toast.warning(message);
        break;
      default:
        toast.info(message);
    }
  }

  return (
    <>
    <div className="page-container">
      <div className="create-exam-container">
        <div className="exam-header">
          <h1>Create New Exam</h1>
          <p className="subtitle">Fill in the details below to create a new exam</p>
        </div>
        
        <div className="import-section">
          <button 
            onClick={() => setShowJsonInput(!showJsonInput)}
            className={`btn btn-import ${showJsonInput ? 'active' : ''}`}
          >
            <i className="fas fa-file-import"></i>
            {showJsonInput ? 'Hide JSON Import' : 'Import Questions from JSON'}
          </button>
          
          {showJsonInput && (
            <div className="json-import-container">
              <div className="json-actions">
                <button 
                  onClick={() => setJsonInput(JSON.stringify(SAMPLE_QUESTIONS, null, 2))}
                  className="btn btn-secondary"
                >
                  <i className="fas fa-file-code"></i> Load Sample
                </button>
                <button 
                  onClick={handleJsonImport}
                  className="btn btn-primary"
                >
                  <i className="fas fa-check"></i> Import Questions
                </button>
              </div>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste your questions in JSON format here..."
                className="json-textarea"
                rows={10}
              />
              <div className="json-format-hint">
                <h4><i className="fas fa-info-circle"></i> JSON Format</h4>
                <pre>
{`[
  {
    "question": "Your question here",
    "type": "mcq", // or "answerable"
    "optionA": "Option A",  // For MCQ only
    "optionB": "Option B",  // For MCQ only
    "optionC": "Option C",  // For MCQ only
    "optionD": "Option D",  // For MCQ only
    "correct_answer": "A"   // For MCQ: A/B/C/D, For answerable: string
  },
  // ... more questions
]`}
                </pre>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="exam-form">
          <div className="form-section">
            <h3><i className="fas fa-info-circle"></i> Exam Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Exam Title <span className="required">*</span></label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g., Midterm Exam - Computer Science 101"
                  required 
                />
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input 
                  type="text" 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)} 
                  placeholder="e.g., Computer Science"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Duration (minutes) <span className="required">*</span></label>
                <input 
                  type="number" 
                  value={duration} 
                  onChange={(e) => setDuration(e.target.value)} 
                  min="1" 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Invite by Email (optional)</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="student@example.com"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Exam Instructions (optional)</label>
              <textarea 
                value={instructions} 
                onChange={(e) => setInstructions(e.target.value)} 
                placeholder="Enter any special instructions for the exam..."
                rows="3"
              />
            </div>
          </div>
          
          <div className="questions-section">
            <div className="section-header">
              <h3><i className="fas fa-question-circle"></i> Questions</h3>
              <span className="question-count">{questions.length} question{questions.length !== 1 ? 's' : ''}</span>
            </div>
            
            <div className="questions-list">
              {questions.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-inbox"></i>
                  <p>No questions added yet. Add your first question to get started.</p>
                </div>
              ) : (
                questions.map((q, i) => (
                  <div key={i} className="question-card">
                    <div className="question-header">
                      <h4>Question {i + 1}</h4>
                      {questions.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeQuestion(i)} 
                          className="btn-text btn-delete"
                        >
                          <i className="fas fa-trash"></i> Remove
                        </button>
                      )}
                    </div>
                    
                    <div className="question-type-toggle">
                      <button 
                        type="button" 
                        className={`toggle-btn ${q.type === 'mcq' ? 'active' : ''}`}
                        onClick={() => handleQuestionChange(i, 'type', 'mcq')}
                      >
                        <i className="fas fa-list-ul"></i> Multiple Choice
                      </button>
                      <button 
                        type="button" 
                        className={`toggle-btn ${q.type === 'answerable' ? 'active' : ''}`}
                        onClick={() => handleQuestionChange(i, 'type', 'answerable')}
                      >
                        <i className="fas fa-pen"></i> Written Answer
                      </button>
                    </div>

                    <div className="form-group">
                      <label>Question Text <span className="required">*</span></label>
                      <textarea
                        value={q.question}
                        onChange={(e) => handleQuestionChange(i, 'question', e.target.value)}
                        placeholder="Enter your question here..."
                        required
                        rows="2"
                      />
                    </div>

                    {q.type === 'mcq' ? (
                      <div className="mcq-options">
                        <label>Options <span className="required">*</span></label>
                        {['A', 'B', 'C', 'D'].map((opt) => (
                          <div key={opt} className="option-row">
                            <div className="option-radio">
                              <input
                                type="radio"
                                id={`q${i}-${opt}`}
                                name={`correct-${i}`}
                                checked={q.correct_answer === opt}
                                onChange={() => handleQuestionChange(i, 'correct_answer', opt)}
                              />
                              <label htmlFor={`q${i}-${opt}`} className="radio-label">
                                <span className="radio-custom"></span>
                                <span className="option-letter">{opt}.</span>
                              </label>
                            </div>
                            <input
                              type="text"
                              value={q[`option${opt}`] || ''}
                              onChange={(e) => handleQuestionChange(i, `option${opt}`, e.target.value)}
                              placeholder={`Option ${opt}`}
                              className="option-input"
                              required
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="answerable-field">
                        <label>Expected Answer <span className="required">*</span></label>
                        <textarea
                          value={q.correct_answer}
                          onChange={(e) => handleQuestionChange(i, 'correct_answer', e.target.value)}
                          placeholder="Enter the expected answer..."
                          required
                          rows="3"
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
              
              <div className="add-question-actions">
                <button 
                  type="button" 
                  onClick={addQuestion} 
                  className="btn btn-outline"
                >
                  <i className="fas fa-plus"></i> Add Question
                </button>
                
                {questions.length > 0 && (
                  <div className="question-stats">
                    <span className="stat">
                      <i className="fas fa-list-ul"></i> 
                      {questions.filter(q => q.type === 'mcq').length} Multiple Choice
                    </span>
                    <span className="stat">
                      <i className="fas fa-pen"></i> 
                      {questions.filter(q => q.type === 'answerable').length} Written
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={() => window.history.back()} className="btn btn-text">
              <i className="fas fa-arrow-left"></i> Back
            </button>
            <div className="action-buttons">
              <button type="button" onClick={() => {
                // Save as draft functionality can be added here
                showToast('Draft saved successfully', 'info');
              }} className="btn btn-outline">
                <i className="far fa-save"></i> Save as Draft
              </button>
              <button type="submit" className="btn btn-primary">
                <i className="fas fa-check"></i> Create Exam
              </button>
            </div>
          </div>
        </form>
      </div>
      
      <style jsx>{`
        /* Inline styles for dynamic elements */
        .toggle-btn {
          transition: all 0.3s ease;
        }
        .toggle-btn.active {
          background: #4CAF50;
          color: white;
        }
        .question-card {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
    </>
 
  );
}
