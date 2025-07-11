import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useNavigate } from "react-router-dom"
import supabase from "../SupabaseClient"
import Navbar from "../Components/common/Navbar"

import { toast } from "react-toastify"
import { FaLock, FaUnlock, FaEye, FaTrash, FaEdit } from "react-icons/fa"

// Modal component for viewing/editing questions
const QuestionModal = ({ exam, onClose, onSave }) => {
  const [editedQuestions, setEditedQuestions] = useState([...exam.questions])
  const [isSaving, setIsSaving] = useState(false)
  
  // Create a new empty question
  const createNewQuestion = (type = 'mcq') => ({
    question: '',
    type: type,
    optionA: type === 'mcq' ? '' : undefined,
    optionB: type === 'mcq' ? '' : undefined,
    optionC: type === 'mcq' ? '' : undefined,
    optionD: type === 'mcq' ? '' : undefined,
    correct_answer: type === 'mcq' ? 'A' : ''
  })

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...editedQuestions]
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    }
    setEditedQuestions(updatedQuestions)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const { error } = await supabase
        .from('exams')
        .update({ questions: editedQuestions })
        .eq('id', exam.id)
      
      if (error) throw error
      onSave(editedQuestions)
      onClose()
    } catch (error) {
      console.error('Error updating questions:', error)
      alert('Failed to update questions. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!exam) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Edit Questions: {exam.title}</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        <div className="questions-container">
          {editedQuestions.map((q, index) => (
            <div key={index} className="question-card">
              {editedQuestions.length > 1 && (
                <button 
                  className="delete-question"
                  onClick={() => setEditedQuestions(editedQuestions.filter((_, i) => i !== index))}
                  title="Delete question"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              )}
              <div className="form-group">
                <label>Question {index + 1}</label>
                <div className="question-type-toggle">
                  <button
                    type="button"
                    className={`toggle-btn ${q.type === 'mcq' ? 'active' : ''}`}
                    onClick={() => handleQuestionChange(index, 'type', 'mcq')}
                  >
                    MCQ
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${q.type === 'answerable' ? 'active' : ''}`}
                    onClick={() => handleQuestionChange(index, 'type', 'answerable')}
                  >
                    Answerable
                  </button>
                </div>
                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                  className="form-control"
                  placeholder="Enter your question here"
                />
              </div>

              {q.type === 'mcq' ? (
                <>
                  <div className="options-grid">
                    {['A', 'B', 'C', 'D'].map((opt) => (
                      <div key={opt} className="form-group">
                        <label>Option {opt}</label>
                        <input
                          type="text"
                          value={q[`option${opt}`] || ''}
                          onChange={(e) => handleQuestionChange(index, `option${opt}`, e.target.value)}
                          className={`form-control ${q.correct_answer === opt ? 'correct-answer' : ''}`}
                          placeholder={`Option ${opt}`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="form-group">
                    <label>Correct Answer</label>
                    <select
                      value={q.correct_answer || 'A'}
                      onChange={(e) => handleQuestionChange(index, 'correct_answer', e.target.value)}
                      className="form-control"
                    >
                      {['A', 'B', 'C', 'D'].map(opt => (
                        <option key={opt} value={opt} disabled={!q[`option${opt}`]}>
                          {q[`option${opt}`] ? `Option ${opt}` : `Option ${opt} (empty)`}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div className="form-group">
                  <label>Expected Answer</label>
                  <textarea
                    value={q.correct_answer || ''}
                    onChange={(e) => handleQuestionChange(index, 'correct_answer', e.target.value)}
                    className="form-control"
                    rows="3"
                    placeholder="Enter the expected answer here"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <div className="left-actions">
            <div className="add-question-container">
              <select 
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    setEditedQuestions([...editedQuestions, createNewQuestion(e.target.value)]);
                    e.target.value = ''; // Reset the select
                  }
                }}
                className="btn btn-add"
                style={{ appearance: 'none', paddingRight: '30px' }}
              >
                <option value="" disabled>Add Question</option>
                <option value="mcq">MCQ Question</option>
                <option value="answerable">Answerable Question</option>
              </select>
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ marginLeft: '-24px', pointerEvents: 'none' }}
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
          </div>
          <div className="right-actions">
            <button onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSave} className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          background: white;
          border-radius: 8px;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eee;
        }
        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }
        .questions-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .question-card {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #4CAF50;
          position: relative;
        }
        
        .delete-question {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #ffebee;
          border: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #c62828;
          padding: 0;
        }
        
        .delete-question:hover {
          background: #ffcdd2;
        }
        .form-group {
          margin-bottom: 15px;
        }
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #333;
        }
        .form-control {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        .form-control:focus {
          outline: none;
          border-color: #4CAF50;
          box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
        }
        .options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin: 15px 0;
        }
        .correct-answer {
          border-color: #4CAF50;
          background-color: #f0f9f0;
        }
        .modal-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #eee;
        }
        
        .left-actions, .right-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        
        .add-question-container {
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .question-type-toggle {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
        }
        
        .toggle-btn {
          flex: 1;
          padding: 6px 12px;
          border: 1px solid #ddd;
          background: #f5f5f5;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .toggle-btn.active {
          background: #4CAF50;
          color: white;
          border-color: #45a049;
        }
        
        .btn-add {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #2196F3;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .btn-add:hover {
          background: #1976D2;
        }
        
        .btn-add svg {
          width: 16px;
          height: 16px;
        }
        .btn {
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary {
          background: #4CAF50;
          color: white;
          border: none;
        }
        .btn-primary:hover {
          background: #45a049;
        }
        .btn-primary:disabled {
          background: #a5d6a7;
          cursor: not-allowed;
        }
        .btn-secondary {
          background: #f0f0f0;
          border: 1px solid #ddd;
          color: #333;
        }
        .btn-secondary:hover {
          background: #e0e0e0;
        }
      `}</style>
    </div>
  )
}

export default function AdminDashboard() {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedExam, setSelectedExam] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loadingStates, setLoadingStates] = useState({})

  const fetchExams = async () => {
    try {
      setLoading(true)
      // Get all exams with their questions
      const { data: examsData, error: examsError } = await supabase
        .from("exams")
        .select("*")
        .order("created_at", { ascending: false })

      if (examsError) throw examsError

      // Add question counts to each exam
      const examsWithCounts = examsData.map(exam => ({
        ...exam,
        questions: exam.questions || [],
        questions_count: Array.isArray(exam.questions) ? exam.questions.length : 0
      }))

      setExams(examsWithCounts || [])
    } catch (err) {
      setError("Failed to load exams. Please try again.")
      console.error("Error fetching exams:", err)
    } finally {
      setLoading(false);
    }
  };

  const toggleExamStatus = async (examId, currentStatus) => {
    try {
      setLoadingStates(prev => ({ ...prev, [examId]: true }));
      
      const { error } = await supabase
        .from('exams')
        .update({ is_active: !currentStatus })
        .eq('id', examId);

      if (error) throw error;

      setExams(exams.map(exam => 
        exam.id === examId ? { ...exam, is_active: !currentStatus } : exam
      ));

      toast.success(`Exam ${!currentStatus ? 'unlocked' : 'locked'} successfully`);
    } catch (error) {
      console.error('Error toggling exam status:', error);
      toast.error(error.message || 'Failed to update exam status');
    } finally {
      setLoadingStates(prev => ({ ...prev, [examId]: false }));
    }
  };

  const handleViewExam = (exam) => {
    setSelectedExam(exam);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedExam(null);
  };

  const handleQuestionsUpdate = (updatedQuestions) => {
    setExams(prevExams => 
      prevExams.map(exam => 
        exam.id === selectedExam.id 
          ? { ...exam, questions: updatedQuestions, questions_count: updatedQuestions.length }
          : exam
      )
    );
  };

  const handleDeleteExam = async (id) => {
    if (window.confirm("Are you sure you want to delete this exam? This action cannot be undone.")) {
      try {
        const { error } = await supabase
          .from("exams")
          .delete()
          .eq("id", id);
        
        if (error) throw error;
        fetchExams();
      } catch (err) {
        setError("Failed to delete exam. Please try again.");
        console.error("Error deleting exam:", err);
      }
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  return (
    <div className="admin-dashboard">
      <Navbar />
      <div className="admin-container">
        <div className="admin-header">
          <div className="admin-title">
            <h1>Exam Dashboard</h1>
            <p>Manage and monitor your exams</p>
          </div>
          <Link to="/create-exam" className="create-exam-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create New Exam
          </Link>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading exams...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="no-exams">
            <div className="no-exams-icon">📝</div>
            <h3>No Exams Found</h3>
            <p>Get started by creating your first exam</p>
            <Link to="/create-exam" className="create-exam-btn">
              Create Your First Exam
            </Link>
          </div>
        ) : (
          <div className="exam-grid">
            {exams.map((exam) => (
              <div className="exam-card" key={exam.id}>
                <div className="exam-card-header">
                  <h3>{exam.title}</h3>
                  <div className={`exam-status ${exam.is_active ? 'active' : 'inactive'}`}>
                    {exam.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
                
                <div className="exam-details">
                  <div className="detail-item">
                    <span className="detail-label">Subject:</span>
                    <span className="detail-value">{exam.subject || 'General'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">{exam.duration_minutes} minutes</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Questions:</span>
                    <span className="detail-value">{exam.questions_count || 0}</span>
                  </div>
                </div>
                
                <div className="exam-actions">
                  <button 
                    onClick={() => handleViewExam(exam)}
                    className="action-btn view"
                    title="View/Edit Questions"
                  >
                    <FaEye />
                    <span>View</span>
                  </button>
                  <button 
                    onClick={() => toggleExamStatus(exam.id, exam.is_active)}
                    className={`action-btn ${exam.is_active ? 'unlock' : 'lock'}`}
                    disabled={loadingStates[exam.id]}
                    title={exam.is_active ? 'Lock Exam' : 'Unlock Exam'}
                  >
                    {loadingStates[exam.id] ? (
                      <span className="spinner"></span>
                    ) : exam.is_active ? (
                      <>
                        <FaUnlock />
                        <span>Unlocked</span>
                      </>
                    ) : (
                      <>
                        <FaLock />
                        <span>Locked</span>
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => handleDeleteExam(exam.id)}
                    className="action-btn delete"
                    title="Delete Exam"
                  >
                    <FaTrash />
                    <span>Delete</span>
                  </button>
                </div>
                
                <div className="exam-footer">
                  <div className="exam-link">
                    <span>Exam Link:</span>
                    <code>{window.location.origin}/exam/{exam.id}</code>
                  </div>
                  <div className="exam-date">
                    Created: {new Date(exam.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      
      {isModalOpen && selectedExam && (
        <QuestionModal 
          exam={selectedExam}
          onClose={handleCloseModal}
          onSave={handleQuestionsUpdate}
        />
      )}
    </div>
  )
}
