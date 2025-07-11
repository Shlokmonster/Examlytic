import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Player } from "@lottiefiles/react-lottie-player";
import supabase from "../SupabaseClient";
import Navbar from "../Components/common/Navbar";
import animationData from "../assets/student-login.json"; // Adjust path if needed

function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            await supabase.auth.signOut();
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // Get user role after successful login
                const { data: userData } = await supabase
                    .from('users')
                    .select('role')
                    .eq('email', session.user.email)
                    .single();
                
                if (userData?.role === 'admin') {
                    navigate('/');
                } else {
                    // For students, redirect to examcode page
                    navigate('/examcode');
                }
            } else {
                setLoading(false);
            }
        };
        init();
    }, [navigate]);

    const handleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: window.location.origin,
                    query: {
                        access_type: "offline",
                        prompt: "consent",
                        scope: "email profile",
                    },
                    skipBrowserRedirect: false,
                },
            });

            if (error) {
                console.error("Login error:", error);
                alert("Login failed. Please try again.");
            }
        } catch (err) {
            alert(`Login error: ${err.message}`);
        }
    };

    return (
        <div className="login-page">
            <Navbar />
            <div className="cont1">
                {loading ? (
                    <div className="spinner">Checking session...</div>
                ) : (
                    <>
                        <Player
                            autoplay
                            loop
                            src={animationData}
                            style={{ height: '400px', width: '600px' }}
                        />

                        <div className="head">Welcome to Examlytic</div>

                        <div className="ins">
                            Sign in with your university email to access your exam proctoring session. <br />
                            Use your official <strong>@university.edu</strong> email for verification.
                        </div>

                        <button className="login" onClick={handleLogin}>
                            <img
                                src="https://cdn-icons-png.flaticon.com/128/720/720255.png"
                                alt="Google"
                                className="google-icon"
                            />
                            Login with University Email
                        </button>

                        <div className="ins2">
                            If you encounter issues, contact your university's IT support.
                        </div>
                    </>
                )}
            </div>

        </div>
    );
}

export default Login;
