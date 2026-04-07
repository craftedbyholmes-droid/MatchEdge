"use client";
import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
type RequestType = "access" | "erasure" | "restriction" | "rectification";
export function PrivacyRequestForm({ userId }: { userId: string; }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [requestType, setRequestType] = useState<RequestType>("access");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState("");
  async function submit() {
    setStatus("Submitting...");
    const { error } = await supabase.from("data_subject_requests").insert({ user_id: userId, request_type: requestType, request_details: details });
    if (error) { setStatus(error.message); return; }
    setStatus("Request submitted");
    setDetails("");
  }
  return <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"><div className="text-lg font-semibold">Privacy Rights Request</div><p className="mt-2 text-sm text-slate-400">Use this form to request access, erasure, restriction, or rectification.</p><div className="mt-4 grid gap-4"><select value={requestType} onChange={(e) => setRequestType(e.target.value as RequestType)} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"><option value="access">Access</option><option value="erasure">Erasure</option><option value="restriction">Restriction</option><option value="rectification">Rectification</option></select><textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Add any relevant details" className="min-h-[120px] rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" /><button type="button" onClick={submit} className="rounded-2xl bg-emerald-500 px-5 py-3 font-medium text-slate-950">Submit request</button></div>{status ? <div className="mt-3 text-sm text-slate-400">{status}</div> : null}</div>;
}