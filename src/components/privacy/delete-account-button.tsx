"use client";

import { useState } from "react";

export function DeleteAccountButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  async function handleDelete() {
    const confirm = window.confirm(
      "Are you sure you want to delete your account? This cannot be undone."
    );

    if (!confirm) return;

    setLoading(true);
    setStatus("Deleting account...");

    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed");
      }

      setStatus("Account deleted");

      // redirect to home
      window.location.href = "/";
    } catch (err: any) {
      setStatus(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6">
      <div className="text-lg font-semibold text-red-200">
        Delete Account
      </div>
      <p className="mt-2 text-sm text-red-300">
        This will permanently delete your account and remove your data from live systems.
      </p>

      <button
        onClick={handleDelete}
        disabled={loading}
        className="mt-4 rounded-2xl bg-red-500 px-5 py-3 font-medium text-white"
      >
        {loading ? "Deleting..." : "Delete my account"}
      </button>

      {status && <div className="mt-3 text-sm text-red-200">{status}</div>}
    </div>
  );
}