"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { parseApiResponse } from "@/lib/client-api";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  applyLink: string;
  description: string;
  via: string;
};

export default function JobTrackerPage() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function searchJobs() {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, location }),
      });
      const payload = await parseApiResponse<{ jobs: Job[] }>(response);
      setJobs(payload.jobs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  async function saveJob(job: Job) {
    const response = await fetch("/api/jobs/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: job.title,
        company: job.company,
        location: job.location,
        applyLink: job.applyLink,
        description: job.description,
        via: job.via,
        externalId: job.id,
      }),
    });
    await parseApiResponse<{ ok: boolean }>(response);
  }

  return (
    <DashboardShell>
      <section className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Job Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Search listings from a free jobs API and save opportunities to Supabase.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search Jobs</CardTitle>
            <CardDescription>Search and save jobs in one place.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                placeholder="Job title"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <Input
                placeholder="Location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
              <Button onClick={searchJobs} disabled={loading}>
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>Save selected jobs into your account dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <div className="rounded-lg border border-border/70 bg-secondary/30 p-4 text-sm text-muted-foreground">
                Job cards will populate here.
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-lg border border-border/70 bg-secondary/30 p-4"
                  >
                    <p className="font-semibold">{job.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {job.company} - {job.location}
                    </p>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                      {job.description || "No description provided"}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" onClick={() => saveJob(job)}>
                        Save
                      </Button>
                      {job.applyLink ? (
                        <a
                          href={job.applyLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm"
                        >
                          Apply
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </DashboardShell>
  );
}
