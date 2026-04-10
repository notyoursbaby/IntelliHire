import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const { userId } = auth();

    const { title, company, location, applyLink, description, via, externalId } = await req.json();
    if (!title || !company) {
      return NextResponse.json({ error: "title and company are required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("saved_jobs").insert({
      clerk_user_id: userId ?? "anonymous",
      external_id: externalId ?? null,
      title,
      company,
      location: location ?? null,
      apply_url: applyLink ?? null,
      description_snippet: description ?? null,
      source: via ?? "SerpApi",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Save job error:", error);
    return NextResponse.json({ error: "Failed to save job." }, { status: 500 });
  }
}
