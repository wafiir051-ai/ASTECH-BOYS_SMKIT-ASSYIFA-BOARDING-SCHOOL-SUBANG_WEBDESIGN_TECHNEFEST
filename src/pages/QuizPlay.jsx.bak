import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { QuizTaker } from "./AssignmentDetail";

export default function QuizPlay() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: assignment, isLoading: loadingAssignment } = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: () => entities.Assignment.filter({ id: assignmentId }).then(r => r[0]),
  });

  const { data: mySubmission, isLoading: loadingSubmission } = useQuery({
    queryKey: ["submission", assignmentId, user?.email],
    queryFn: () => entities.Submission.filter({ assignment_id: assignmentId, student_id: user.email }).then(r => r[0] ?? null),
    enabled: !!user?.email,
  });

  if (loadingAssignment || loadingSubmission || !assignment) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a" }}>
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (assignment.type !== "quiz") {
    navigate(`/courses/${assignment.course_id}/assignments/${assignmentId}`);
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", padding: "20px" }}>
      <QuizTaker assignment={assignment} user={user} existingSubmission={mySubmission} />
    </div>
  );
}
