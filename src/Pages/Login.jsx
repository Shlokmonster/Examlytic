import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../SupabaseClient";
import Navbar from "../Components/common/Navbar";
import Footer from "../Components/common/Footer";

function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true); // 👈 Loading state

    useEffect(() => {
        const init = async () => {
            // 🔒 Sign out any existing session
            await supabase.auth.signOut();

            // 🔍 Then check if there's still a session (e.g., due to local tokens)
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                navigate("/exam");
            } else {
                setLoading(false); // ✅ Show UI after checking
            }
        };

        init();
    }, [navigate]);

    // 🔘 Handle Google OAuth login
    const handleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/exam`,
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
        <div>
            <Navbar />
            <div className="cont1">
                {loading ? (
                    <div className="spinner">
                        Checking session...
                    </div>
                ) : (
                    <>
                        <div className="head">Welcome to Examlytic</div>
                        <div className="ins">
                            Sign in with your university email to access your exam proctoring session.
                            Please ensure you are using your official <br />
                            university email address for verification.
                        </div>

                        <button className="login" onClick={handleLogin}>
                            
                            Login with University Email
                        </button>

                        <div className="ins2">
                            If you encounter any issues, please contact your university's IT support.
                        </div>
                    </>
                )}
            </div>
            <Footer />
        </div>
    );
}

export default Login;

