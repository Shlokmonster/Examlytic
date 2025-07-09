import { Routes, Route, Navigate } from "react-router-dom"
import { useEffect, useState } from "react"
import supabase from "./SupabaseClient"
import { useAuth } from "./hooks/useAuth"
// Pages
import Login from "./Pages/Login"
import AdminDashboard from "./Pages/AdminDashboard"
import CreateExam from "./Pages/CreateExam"
import StudentExamPage from "./Pages/StudentExamPage"
import ExamIntro from "./Pages/ExamIntro"
import ExamAttempt from "./Pages/ExamAttempt"
import ExamBlocked from "./Pages/ExamBlocked";
import ExamStatusCheck from "./components/ExamStatusCheck";
import ExamRedirect from "./Pages/ExamRedirect";

function App() {
  const { user, loading } = useAuth()
  const [role, setRole] = useState(null)

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) return
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("email", user.email)
        .single()

      if (error || !data) {
        // If user not found in users table, add them as student
        await supabase.from("users").insert([{ email: user.email, role: "student" }])
        setRole("student")
      } else {
        setRole(data.role)
      }
    }

    fetchRole()
  }, [user])

  if (loading) return <div style={{ padding: "30px" }}>Loading...</div>
  if (!user) return <Login />
  if (!role) return <div>Loading user role...</div>

  return (
    <Routes>
      {/* Admin Routes */}
      {role === "admin" && (
        <>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/create" element={<CreateExam />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" />} />
        </>
      )}

      {/* Student Routes */}
      {role === "student" && (
        <>
          <Route path="/student" element={<StudentExamPage />} />
          <Route element={<ExamStatusCheck />}>
            <Route path="/exam/intro/:id" element={<ExamIntro />} />
            <Route path="/exam/attempt/:id" element={<ExamAttempt />} />
          </Route>
          {/* Handle direct exam links from admin dashboard */}
          <Route path="/exam/:id" element={<ExamRedirect />} />
          <Route path="/exam/blocked/:id" element={<ExamBlocked />} />
          <Route path="*" element={<Navigate to="/exam/intro" />} />
        </>
      )}
    </Routes>
  )
}

export default App
