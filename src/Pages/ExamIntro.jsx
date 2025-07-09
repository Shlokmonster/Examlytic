import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import supabase from "../SupabaseClient";
import Navbar from "../Components/common/Navbar";
import Footer from "../Components/common/Footer";

export default function ExamIntro() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { exam } = useOutletContext() || {};
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const [webcamReady, setWebcamReady] = useState(false);

  useEffect(() => {
    // Start webcam
    const startWebcam = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' },
            audio: false 
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setWebcamReady(true);
          }
        } else {
          setError("Webcam not available on this device.");
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setError("Could not access webcam. Please ensure you've granted camera permissions.");
      }
    };

    startWebcam();

    // Cleanup function to stop the webcam when component unmounts
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleStartExam = () => {
    if (id) {
      navigate(`/exam/attempt/${id}`);
    }
  };

  if (!exam) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Exam Not Found</h2>
            <p className="text-gray-600 mb-4">The requested exam could not be loaded.</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="exam-intro-container">
      <Navbar />
      <div className="exam-content">
        <div className="exam-header">
          <h1>{exam.title || 'Exam Instructions'}</h1>
          <div className="exam-meta">
            <div className="meta-item">
              <span className="meta-label">Duration</span>
              <span className="meta-value">{exam.duration_minutes || '--'} minutes</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Total Questions</span>
              <span className="meta-value">{exam.questions?.length || '--'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Type</span>
              <span className="meta-value">MCQ</span>
            </div>
          </div>
        </div>

        <div className="exam-instructions">
          <h2>Instructions</h2>
          <div className="instructions-content">
            <p className="mb-4">Please read the following instructions carefully before starting the exam:</p>
            <ol>
              <li>Make sure you have a stable internet connection throughout the exam.</li>
              <li>This exam must be completed in one sitting. You cannot pause and return later.</li>
              <li>Do not switch tabs or applications during the exam, as this may be flagged as suspicious activity.</li>
              <li>You must keep your webcam on for the duration of the exam.</li>
              <li>Make sure your face is clearly visible in the webcam preview.</li>
              <li>Do not use any unauthorized materials or assistance during the exam.</li>
              <li>Answer all questions before submitting. You can review your answers before final submission.</li>
              <li>Once submitted, you cannot change your answers.</li>
            </ol>
            <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500">
              <p className="text-blue-700 font-medium">Note:</p>
              <p className="text-blue-600 text-sm mt-1">
                The exam will be automatically submitted when the time runs out. Make sure to submit your answers before the time expires.
              </p>
            </div>
          </div>
        </div>

        <div className="camera-section">
          <div className="camera-preview">
            <h3>Webcam Preview</h3>
            <div className="video-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="webcam-feed"
              />
            </div>
            {!webcamReady && !error && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-3"></div>
                <p className="text-gray-500">Initializing webcam...</p>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <p className="text-red-700">
                  <span className="font-medium">Webcam Error:</span> {error}
                </p>
                <button 
                  onClick={setupWebcam}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Retry
                </button>
              </div>
            )}
            {webcamReady && (
              <div className="mt-4 text-center">
                <p className="text-sm text-green-600 font-medium">
                  ✓ Webcam connected successfully
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Make sure your face is clearly visible
                </p>
              </div>
            )}
            
            <div className="start-exam-section mt-6">
              <p className="ready-text">
                I confirm that I have read and understood all the instructions. I'm ready to begin the exam.
              </p>
              <button
                className="start-exam-btn"
                onClick={handleStartExam}
                disabled={!webcamReady || !!error}
              >
                Start Exam Now
              </button>
              {(!webcamReady || error) && (
                <p className="text-sm text-red-500 mt-3">
                  {error ? 'Please resolve the webcam issue to continue' : 'Please wait for webcam to initialize...'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
