"use client";

import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function ChatShell({
  userId,
  chats,
  invites,
}: {
  userId: string;
  chats: Array<{ id: string; title: string; description: string | null; member_count?: number | null; latest_message?: string | null }>;
  invites: Array<{ id: string; status: string; chats: { title: string } | null; inviter: { username: string | null; display_name: string | null } | null }>;
}) {
  const [newChatTitle, setNewChatTitle] = useState("");
  const [newChatDescription, setNewChatDescription] = useState("");
  const [inviteUsername, setInviteUsername] = useState("");
  const [selectedChatId, setSelectedChatId] = useState(chats[0]?.id || "");
  const [status, setStatus] = useState("");

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  async function createChat() {
    setStatus("Creating chat...");
    const { data, error } = await supabase.rpc("create_chat_with_owner", {
      chat_title: newChatTitle,
      chat_description: newChatDescription || null,
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus(`Chat created: ${data}`);
    window.location.reload();
  }

  async function inviteUser() {
    if (!selectedChatId) {
      setStatus("Pick a chat first.");
      return;
    }

    setStatus("Sending invite...");
    const { error } = await supabase.rpc("invite_user_to_chat", {
      target_chat_id: selectedChatId,
      target_username: inviteUsername,
    });

    setStatus(error ? error.message : "Invite sent");
    if (!error) window.location.reload();
  }

  async function respond(inviteId: string, acceptInvite: boolean) {
    setStatus(acceptInvite ? "Accepting invite..." : "Declining invite...");
    const { error } = await supabase.rpc("respond_to_chat_invite", {
      target_invite_id: inviteId,
      accept_invite: acceptInvite,
    });

    setStatus(error ? error.message : acceptInvite ? "Invite accepted" : "Invite declined");
    if (!error) window.location.reload();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="text-lg font-semibold">Create Chat</div>
          <div className="mt-4 grid gap-4">
            <input
              value={newChatTitle}
              onChange={(e) => setNewChatTitle(e.target.value)}
              placeholder="Chat title"
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
            />
            <textarea
              value={newChatDescription}
              onChange={(e) => setNewChatDescription(e.target.value)}
              placeholder="Description"
              className="min-h-[110px] rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
            />
            <button onClick={createChat} className="rounded-2xl bg-emerald-500 px-5 py-3 font-medium text-slate-950">
              Create Chat
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="text-lg font-semibold">Invite User by Username</div>
          <p className="mt-2 text-sm text-slate-400">
            Users are added only after they explicitly accept the invite guard.
          </p>

          <div className="mt-4 grid gap-4">
            <select
              value={selectedChatId}
              onChange={(e) => setSelectedChatId(e.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
            >
              <option value="">Select chat</option>
              {chats.map((chat) => (
                <option key={chat.id} value={chat.id}>
                  {chat.title}
                </option>
              ))}
            </select>

            <input
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value)}
              placeholder="Username to invite"
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
            />

            <button onClick={inviteUser} className="rounded-2xl bg-cyan-500 px-5 py-3 font-medium text-slate-950">
              Send Invite
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="text-lg font-semibold">Your Chats</div>
          <div className="mt-4 space-y-3">
            {chats.length ? (
              chats.map((chat) => (
                <div key={chat.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="text-base font-medium">{chat.title}</div>
                  <div className="mt-1 text-sm text-slate-400">{chat.description || "No description"}</div>
                  <div className="mt-2 text-xs text-slate-500">
                    Members: {chat.member_count ?? 0} • Latest: {chat.latest_message || "No messages yet"}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-400">No chats yet.</div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="text-lg font-semibold">Pending Invites</div>
          <div className="mt-4 space-y-3">
            {invites.length ? (
              invites.map((invite) => (
                <div key={invite.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="text-sm font-medium">{invite.chats?.title || "Chat"}</div>
                  <div className="mt-1 text-sm text-slate-400">
                    Invited by {invite.inviter?.display_name || invite.inviter?.username || "user"}
                  </div>
                  <div className="mt-3 flex gap-3">
                    <button
                      onClick={() => respond(invite.id, true)}
                      className="rounded-2xl bg-emerald-500 px-4 py-2 font-medium text-slate-950"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => respond(invite.id, false)}
                      className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-2 text-white"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-400">No pending invites.</div>
            )}
          </div>
        </div>

        {status ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
            {status}
          </div>
        ) : null}
      </div>
    </div>
  );
}