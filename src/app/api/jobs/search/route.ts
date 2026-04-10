import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    auth();

    const { query, location } = (await req.json()) as { query: string; location?: string };
    if (!query?.trim()) {
      return NextResponse.json({ error: "Job title is required." }, { status: 400 });
    }

    const adzunaId = process.env.ADZUNA_APP_ID;
    const adzunaKey = process.env.ADZUNA_APP_KEY;
    const serpKey = process.env.SERPAPI_API_KEY;

    if (adzunaId && adzunaKey) {
      const adzunaUrl = new URL(
        `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${adzunaId}&app_key=${adzunaKey}`
      );
      adzunaUrl.searchParams.set("results_per_page", "20");
      adzunaUrl.searchParams.set("what", query);
      if (location?.trim()) adzunaUrl.searchParams.set("where", location.trim());
      adzunaUrl.searchParams.set("content-type", "application/json");

      const response = await fetch(adzunaUrl.toString(), { cache: "no-store" });
      if (!response.ok) {
        return NextResponse.json({ error: "Adzuna API request failed." }, { status: 502 });
      }

      const payload = await response.json();
      const jobs = (payload.results ?? []).map((item: any) => ({
        id: item.id?.toString() ?? crypto.randomUUID(),
        title: item.title ?? "Untitled",
        company: item.company?.display_name ?? "Unknown",
        location: item.location?.display_name ?? "Remote",
        applyLink: item.redirect_url ?? "",
        description: item.description ?? "",
        via: "Adzuna",
      }));

      return NextResponse.json({ jobs });
    }

    if (!serpKey) {
      return NextResponse.json(
        { error: "No job search API key configured. Add Adzuna or SerpApi keys." },
        { status: 500 }
      );
    }

    const serpUrl = new URL("https://serpapi.com/search.json");
    serpUrl.searchParams.set("engine", "google_jobs");
    serpUrl.searchParams.set("q", query);
    if (location?.trim()) serpUrl.searchParams.set("location", location);
    serpUrl.searchParams.set("api_key", serpKey);

    const response = await fetch(serpUrl.toString(), { cache: "no-store" });
    if (!response.ok) {
      const raw = await response.text();
      let upstreamMessage = "Job search API failed.";
      try {
        const parsed = JSON.parse(raw) as { error?: string };
        if (parsed?.error) upstreamMessage = `SerpApi: ${parsed.error}`;
      } catch {
        // keep default message
      }
      return NextResponse.json({ error: upstreamMessage }, { status: 502 });
    }

    const payload = await response.json();
    const jobs = (payload.jobs_results ?? []).map((item: any) => ({
      id: item.job_id ?? item.share_link ?? crypto.randomUUID(),
      title: item.title ?? "Untitled",
      company: item.company_name ?? "Unknown",
      location: item.location ?? "Remote",
      applyLink: item.related_links?.[0]?.link ?? item.share_link ?? "",
      description: item.description ?? "",
      via: item.via ?? "SerpApi",
    }));

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Job search error:", error);
    return NextResponse.json({ error: "Failed to search jobs." }, { status: 500 });
  }
}
