"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { parseApiResponse } from "@/lib/client-api";

export default function InterviewCoachPage() {
  const [roleTitle, setRoleTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Array<{ role: "ai" | "user"; content: string }>>(
    []
  );
  const [lastCritique, setLastCritique] = useState<any>(null);

  async function startInterview() {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/interview/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "start",
          roleTitle,
          jobDescription,
        }),
      });
      const payload = await parseApiResponse<{
        questions: string[];
        questionIndex: number;
        currentQuestion: string;
      }>(response);

      setQuestions(payload.questions);
      setQuestionIndex(payload.questionIndex);
      setCurrentQuestion(payload.currentQuestion);
      setTranscript([{ role: "ai", content: payload.currentQuestion }]);
      setLastCritique(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer() {
    if (!currentQuestion || !answer.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const nextTranscript = [...transcript, { role: "user" as const, content: answer }];
      const response = await fetch("/api/interview/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "answer",
          roleTitle,
          jobDescription,
          questions,
          questionIndex,
          answer,
          transcript: nextTranscript,
        }),
      });
      const payload = await parseApiResponse<{
        critique: any;
        done: boolean;
        nextIndex: number;
        nextQuestion: string;
      }>(response);

      setLastCritique(payload.critique ?? null);
      setAnswer("");

      if (payload.done) {
        setCurrentQuestion(null);
        setTranscript(nextTranscript);
      } else {
        setQuestionIndex(payload.nextIndex);
        setCurrentQuestion(payload.nextQuestion);
        setTranscript([...nextTranscript, { role: "ai", content: payload.nextQuestion }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell>
      <section className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">AI Interview Coach</h1>
            <p className="text-sm text-muted-foreground">
              A hard-hitting interviewer that critiques your answers with STAR framework.
            </p>
          </div>
          <Badge>5-question flow</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Interview Setup</CardTitle>
            <CardDescription>
              Paste the target job description to tailor the interview.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Role title (e.g. Senior Frontend Engineer)"
              value={roleTitle}
              onChange={(event) => setRoleTitle(event.target.value)}
            />
            <Textarea
              placeholder="Paste the job description..."
              className="min-h-40"
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
            />
            <Button className="w-full md:w-auto" onClick={startInterview} disabled={loading}>
              {loading ? "Starting..." : "Start Mock Interview"}
            </Button>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Real-Time Chat</CardTitle>
            <CardDescription>
              The assistant asks one question at a time and waits for your response.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="min-h-64 space-y-3 rounded-lg border border-border/70 bg-secondary/30 p-4 text-sm">
              {transcript.length === 0 ? (
                <p className="text-muted-foreground">Chat stream will appear here.</p>
              ) : (
                transcript.map((item, index) => (
                  <div
                    key={`${item.role}-${index}`}
                    className={item.role === "ai" ? "text-accent" : "text-foreground"}
                  >
                    <strong>{item.role === "ai" ? "Interviewer" : "You"}:</strong> {item.content}
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-3">
              <Input
                placeholder="Type your answer..."
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                disabled={!currentQuestion || loading}
              />
              <Button onClick={submitAnswer} disabled={!currentQuestion || loading}>
                Send
              </Button>
            </div>
            {lastCritique ? (
              <div className="rounded-lg border border-border/70 bg-secondary/30 p-4 text-sm">
                <p className="font-semibold text-accent">Brutally Honest Critique</p>
                <p className="mt-2">Score: {lastCritique.score ?? "--"}/10</p>
                <p className="mt-2 text-muted-foreground">{lastCritique.blunt_critique}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </DashboardShell>
  );
}
