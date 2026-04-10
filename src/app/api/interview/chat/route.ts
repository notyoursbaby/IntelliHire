import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getGroqClient, GROQ_MODEL } from "@/lib/groq";
import { safeJsonParse } from "@/lib/json-response";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type InterviewBody = {
  mode: "start" | "answer";
  roleTitle: string;
  jobDescription: string;
  questions?: string[];
  questionIndex?: number;
  answer?: string;
  transcript?: Array<{ role: "ai" | "user"; content: string }>;
};

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const groq = getGroqClient();

    const body = (await req.json()) as InterviewBody;
    const roleTitle = body.roleTitle?.trim();
    const jobDescription = body.jobDescription?.trim();
    if (!roleTitle || !jobDescription) {
      return NextResponse.json(
        { error: "Role title and job description are required." },
        { status: 400 }
      );
    }

    if (body.mode === "start") {
      const prompt = `Generate exactly 5 hard-hitting technical interview questions for this role.
Return JSON only in this shape: {"questions":["q1","q2","q3","q4","q5"]}.
Role: ${roleTitle}
Job Description:
${jobDescription}`;

      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
      });

      const content = completion.choices[0]?.message?.content ?? "{}";
      const parsed = safeJsonParse<{ questions: string[] }>(content);
      const questions = parsed?.questions?.slice(0, 5) ?? [];
      if (questions.length < 5) {
        return NextResponse.json({ error: "Could not generate 5 questions." }, { status: 500 });
      }

      return NextResponse.json({ questions, currentQuestion: questions[0], questionIndex: 0 });
    }

    const questions = body.questions ?? [];
    const questionIndex = Number(body.questionIndex ?? 0);
    const answer = body.answer?.trim();
    if (!answer || !questions[questionIndex]) {
      return NextResponse.json({ error: "Missing question/answer context." }, { status: 400 });
    }

    const critiquePrompt = `You are a brutally honest technical interview coach.
Evaluate this candidate answer with STAR method.
Return JSON only with keys:
{"score":number,"star_feedback":{"situation":"...","task":"...","action":"...","result":"..."},"blunt_critique":"...","improvement_tips":["...","..."]}
Question: ${questions[questionIndex]}
Answer: ${answer}
Role: ${roleTitle}
Job description:
${jobDescription}`;

    const critiqueCompletion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: critiquePrompt }],
    });

    const critiqueContent = critiqueCompletion.choices[0]?.message?.content ?? "{}";
    const critique = safeJsonParse<{
      score: number;
      star_feedback: Record<string, string>;
      blunt_critique: string;
      improvement_tips: string[];
    }>(critiqueContent);

    const transcript = body.transcript ?? [];
    const nextIndex = questionIndex + 1;
    const done = nextIndex >= 5;
    const nextQuestion = done ? null : questions[nextIndex];

    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin.from("interviews").insert({
      clerk_user_id: userId ?? "anonymous",
      role_title: roleTitle,
      job_description: jobDescription,
      transcript: [
        ...transcript,
        { role: "ai", content: questions[questionIndex] },
        { role: "user", content: answer },
      ],
      latest_feedback: critique ?? {},
      question_index: questionIndex,
      completed: done,
    });

    return NextResponse.json({
      critique,
      nextQuestion,
      nextIndex,
      done,
    });
  } catch (error) {
    console.error("Interview route error:", error);
    return NextResponse.json({ error: "Interview processing failed." }, { status: 500 });
  }
}
