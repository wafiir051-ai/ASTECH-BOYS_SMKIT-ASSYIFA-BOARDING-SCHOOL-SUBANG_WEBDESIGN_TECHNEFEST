import { useState } from "react";
import { useParams, useOutletContext, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseClient";
import { ArrowLeft, Plus, Trash2, CheckCircle, Clock, Star } from "lucide-react";
import { NoomoCard, NoomoButton } from "@/components/ui/NoomoCard";
import { toast } from "sonner";

const EMPTY_QUESTION = () => ({
  question: "",
  options: ["", "", "", ""],
  correct_answer: 0,
  points: 10,
});

export default function QuizBuilder() {
  const { courseId, assignmentId } = useParams();
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const isEdit = !!assignmentId;

  const { data: existing } = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: () => entities.Assignment.filter({ id: assignmentId }).then(r => r[0]),
    enabled: isEdit,
  });

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => entities.Course.filter({ id: courseId }).then(r => r[0]),
  });

  const [title, setTitle] = useState(existing?.title || "");
  const [description, setDescription] = useState(existing?.description || "");
  const [dueDate, setDueDate] = useState(existing?.due_date || "");
  const [_timeLimit, _setTimeLimit] = useState(existing?.time_limit || "");
  const [questions, setQuestions] = useState(
    existing?.quiz_questions?.length ? existing.quiz_questions : [EMPTY_QUESTION()]
  );

  // Sync from query when editing
  const [initialized, setInitialized] = useState(false);
  if (isEdit && existing && !initialized) {
    setTitle(existing.title || "");
    setDescription(existing.description || "");
    setDueDate(existing.due_date || "");
    setQuestions(existing.quiz_questions?.length ? existing.quiz_questions : [EMPTY_QUESTION()]);
    setInitialized(true);
  }

  const save = useMutation({
    mutationFn: (data) => isEdit
      ? entities.Assignment.update(assignmentId, data)
      : entities.Assignment.create({
          ...data,
          course_id: courseId,
          course_title: course?.title || "",
          teacher_id: user.email,
          type: "quiz",
          published: true,
        }),
    onSuccess: () => {
      qc.invalidateQueries(["assignments", courseId]);
      toast.success(isEdit ? "Kuis diperbarui!" : "Kuis berhasil dibuat!");
      navigate(`/courses/${courseId}`);
    },
  });

  const addQuestion = () => setQuestions([...questions, EMPTY_QUESTION()]);

  const removeQuestion = (idx) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx, field, val) => {
    const updated = questions.map((q, i) => i === idx ? { ...q, [field]: val } : q);
    setQuestions(updated);
  };

  const updateOption = (qIdx, oIdx, val) => {
    const updated = questions.map((q, i) => {
      if (i !== qIdx) return q;
      const opts = [...q.options];
      opts[oIdx] = val;
      return { ...q, options: opts };
    });
    setQuestions(updated);
  };

  const totalPoints = questions.reduce((a, q) => a + (Number(q.points) || 0), 0);

  const handleSave = () => {
    if (!title.trim()) { toast.error("Judul kuis harus diisi!"); return; }
    const invalid = questions.some(q => !q.question.trim() || q.options.some(o => !o.trim()));
    if (invalid) { toast.error("Semua soal dan opsi jawaban harus diisi!"); return; }
    save.mutate({
      title,
      description,
      due_date: dueDate || undefined,
      max_score: totalPoints,
      quiz_questions: questions,
    });
  };

  return (
    <div className="animate-fade-in max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(`/courses/${courseId}`)}
          className="flex items-center gap-2 text-sm text-medium-gray hover:text-vibrant-blue transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <p className="text-xs text-medium-gray font-editorial uppercase tracking-widest">{course?.title}</p>
          <h2 className="text-2xl font-display font-bold text-foreground tracking-tight">
            {isEdit ? "Edit Kuis" : "Buat Kuis Baru"}
          </h2>
        </div>
        <NoomoButton onClick={handleSave} disabled={save.isPending}>
          {save.isPending ? "Menyimpan..." : isEdit ? "Perbarui Kuis" : "Terbitkan Kuis"}
        </NoomoButton>
      </div>

      {/* Quiz Settings */}
      <NoomoCard className="p-6 mb-6 space-y-5">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-medium-gray">Pengaturan Kuis</h3>
        <div>
          <label className="block text-xs font-editorial mb-2">Judul Kuis *</label>
          <input
            className="noomo-input w-full text-lg font-bold"
            placeholder="cth: Ulangan Harian Bab 3"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-editorial mb-2">Deskripsi / Instruksi</label>
          <textarea
            className="noomo-input w-full resize-none h-auto min-h-[60px] pb-2"
            placeholder="Petunjuk pengerjaan soal..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-editorial mb-2 flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Batas Waktu
            </label>
            <input
              type="datetime-local"
              className="noomo-input w-full text-sm"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-editorial mb-2 flex items-center gap-1.5">
              <Star className="w-3 h-3" /> Total Poin
            </label>
            <div className="h-12 flex items-center">
              <span className="text-2xl font-display font-bold text-vibrant-blue">{totalPoints}</span>
              <span className="text-medium-gray text-sm font-editorial ml-2">poin</span>
            </div>
          </div>
        </div>
      </NoomoCard>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, qi) => (
          <NoomoCard key={qi} className="p-6">
            {/* Question header */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-navy text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                {qi + 1}
              </div>
              <div className="flex-1">
                <textarea
                  className="w-full text-sm font-semibold text-foreground bg-transparent outline-none resize-none border-b border-border focus:border-vibrant-blue pb-2 min-h-[40px] transition-colors"
                  placeholder="Tulis pertanyaan di sini..."
                  value={q.question}
                  onChange={e => updateQuestion(qi, "question", e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="w-14 text-center text-sm font-bold border border-border py-1 outline-none focus:border-vibrant-blue"
                    value={q.points}
                    onChange={e => updateQuestion(qi, "points", Number(e.target.value))}
                  />
                  <span className="text-xs text-medium-gray font-editorial">poin</span>
                </div>
                <button
                  onClick={() => removeQuestion(qi)}
                  disabled={questions.length === 1}
                  className="w-7 h-7 flex items-center justify-center text-medium-gray hover:text-red-500 transition-colors disabled:opacity-30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-11">
              {q.options.map((opt, oi) => (
                <div
                  key={oi}
                  className={`flex items-center gap-2 p-3 border transition-all cursor-pointer group ${
                    q.correct_answer === oi
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-border hover:border-navy/30"
                  }`}
                  onClick={() => updateQuestion(qi, "correct_answer", oi)}
                >
                  <div className={`w-5 h-5 flex-shrink-0 flex items-center justify-center text-xs font-bold rounded-full border-2 transition-all ${
                    q.correct_answer === oi
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-medium-gray/40 text-medium-gray"
                  }`}>
                    {q.correct_answer === oi ? <CheckCircle className="w-3 h-3" /> : String.fromCharCode(65 + oi)}
                  </div>
                  <input
                    className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-medium-gray/50"
                    placeholder={`Opsi ${String.fromCharCode(65 + oi)}`}
                    value={opt}
                    onChange={e => { e.stopPropagation(); updateOption(qi, oi, e.target.value); }}
                    onClick={e => e.stopPropagation()}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-medium-gray font-editorial mt-3 ml-11">
              Klik opsi untuk menandai sebagai jawaban benar
            </p>
          </NoomoCard>
        ))}

        {/* Add question */}
        <button
          onClick={addQuestion}
          className="w-full border-2 border-dashed border-border hover:border-vibrant-blue/50 p-5 flex items-center justify-center gap-2 text-medium-gray hover:text-vibrant-blue transition-all group"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm font-semibold">Tambah Soal</span>
        </button>
      </div>

      {/* Bottom save */}
      <div className="mt-8 flex items-center justify-between bg-white border border-border p-4">
        <p className="text-sm text-medium-gray font-editorial">
          <span className="font-bold text-foreground">{questions.length}</span> soal · <span className="font-bold text-foreground">{totalPoints}</span> poin total
        </p>
        <NoomoButton onClick={handleSave} disabled={save.isPending}>
          {save.isPending ? "Menyimpan..." : isEdit ? "Perbarui Kuis" : "Terbitkan Kuis"}
        </NoomoButton>
      </div>
    </div>
  );
}