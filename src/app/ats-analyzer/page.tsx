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

export default function AtsAnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [missingKeywords, setMissingKeywords] = useState<string[]>([]);
  const [improvedBullets, setImprovedBullets] = useState<string[]>([]);

  async function runAnalysis() {
    setError(null);
    if (!file || !jobDescription.trim()) {
      setError("Please upload a PDF and paste a job description.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("jobDescription", jobDescription);

      const response = await fetch("/api/ats/analyze", {
        method: "POST",
        body: formData,
      });
      const payload = await parseApiResponse<{
        score: number;
        missingKeywords: string[];
        improvedBullets: string[];
      }>(response);

      setScore(payload.score ?? null);
      setMissingKeywords(payload.missingKeywords ?? []);
      setImprovedBullets(payload.improvedBullets ?? []);
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
            <h1 className="text-2xl font-semibold">ATS Analyzer</h1>
            <p className="text-sm text-muted-foreground">
              Upload your resume and compare against a target role.
            </p>
          </div>
          <Badge variant="accent">Groq: llama-3.3-70b-versatile</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resume + Job Description</CardTitle>
            <CardDescription>
              We will extract text from your PDF, score ATS fit, and suggest improved bullet
              points.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="file"
              accept="application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <Textarea
              placeholder="Paste the full job description here..."
              className="min-h-40"
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
            />
            <Button className="w-full md:w-auto" onClick={runAnalysis} disabled={loading}>
              {loading ? "Analyzing..." : "Analyze Resume"}
            </Button>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>ATS Score</CardTitle>
              <CardDescription>Live score from 0-100</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-accent">{score ?? "--"}</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Missing Keywords</CardTitle>
              <CardDescription>High-impact keywords not found in resume.</CardDescription>
            </CardHeader>
            <CardContent>
              {missingKeywords.length === 0 ? (
                <p className="text-sm text-muted-foreground">No analysis yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {missingKeywords.map((keyword) => (
                    <Badge key={keyword} variant="outline">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Improved Resume Bullets</CardTitle>
            <CardDescription>Use these stronger bullets to improve ATS alignment.</CardDescription>
          </CardHeader>
          <CardContent>
            {improvedBullets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No analysis yet.</p>
            ) : (
              <ul className="space-y-2 text-sm text-foreground">
                {improvedBullets.map((bullet) => (
                  <li key={bullet} className="rounded-md bg-secondary/40 p-3">
                    {bullet}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </DashboardShell>
  );
}
