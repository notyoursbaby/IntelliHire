import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getGroqClient, GROQ_MODEL } from "@/lib/groq";
import { safeJsonParse } from "@/lib/json-response";
import { supabaseAdmin } from "@/lib/supabase-admin";

type AtsOutput = {
  score: number;
  missing_keywords: string[];
  improved_bullets: string[];
};

export async function POST(req: Request) {
  try {
    const { userId } = auth();

    const form = await req.formData();
    const resumeFile = form.get("resume");
    const jobDescription = String(form.get("jobDescription") ?? "").trim();

    if (!(resumeFile instanceof File) || !jobDescription) {
      return NextResponse.json(
        { error: "Resume PDF and job description are required." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await resumeFile.arrayBuffer());
    const pdfModule = (await import("pdf-parse")) as any;
    const pdfParse = pdfModule.default ?? pdfModule;
    const parsed = await pdfParse(buffer);
    const resumeText = parsed.text?.trim() ?? "";
    if (!resumeText) {
      return NextResponse.json({ error: "Could not extract text from PDF." }, { status: 400 });
    }

    const prompt = `You are an elite ATS reviewer.
Return strict JSON only with keys: score (0-100), missing_keywords (string[]), improved_bullets (3-5 strings).
Use this resume text:
${resumeText}

Use this job description:
${jobDescription}`;

    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const result = safeJsonParse<AtsOutput>(content);
    if (!result) {
      return NextResponse.json({ error: "Failed to parse ATS analysis." }, { status: 500 });
    }

    const score = Number(result.score ?? 0);
    const missingKeywords = Array.isArray(result.missing_keywords)
      ? result.missing_keywords.slice(0, 15)
      : [];
    const improvedBullets = Array.isArray(result.improved_bullets)
      ? result.improved_bullets.slice(0, 5)
      : [];

    await supabaseAdmin.from("resumes").insert({
      clerk_user_id: userId ?? "anonymous",
      extracted_text: resumeText,
      score,
      missing_keywords: missingKeywords,
      improved_bullets: improvedBullets,
      job_description: jobDescription,
    });

    return NextResponse.json({
      score,
      missingKeywords,
      improvedBullets,
      extractedChars: resumeText.length,
    });
  } catch (error) {
    console.error("ATS analyze error:", error);
    return NextResponse.json({ error: "Failed to analyze resume." }, { status: 500 });
  }
}
