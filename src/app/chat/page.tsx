import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ChatPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const [{ data: chats }, { data: invites }] = await Promise.all([
    supabase
      .from("chat_overview")
      .select("chat_id, title, member_count, latest_message_at")
      .eq("user_id", user.id)
      .order("latest_message_at", { ascending: false })
      .limit(20),
    supabase
      .from("chat_invites")
      .select("id, chat_id, invited_username, status, created_at")
      .eq("invited_user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Chat"
        title="Multi-chat collaboration with invite acceptance guard"
        description="Users can create multiple chats, invite by username, and only join after accepting an invite."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="text-2xl font-semibold">Create Chat</div>
            <p className="mt-3 text-sm text-slate-400">
              Keep collaboration structured. Separate welcome-offer discussions, execution notes, and ongoing value chats instead of forcing everything into one room.
            </p>
            <div className="mt-4 grid gap-4">
              <input
                readOnly
                value="Chat title"
                className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-500"
              />
              <textarea
                readOnly
                value="Description"
                className="min-h-[120px] rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-500"
              />
              <div className="rounded-2xl bg-emerald-500 px-5 py-4 text-center text-sm font-medium text-slate-950">
                Create Chat
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="text-2xl font-semibold">Invite User by Username</div>
            <p className="mt-3 text-sm text-slate-400">
              Users are added only after they explicitly accept the invite guard.
            </p>
            <div className="mt-4 grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-500">
                Select chat
              </div>
              <input
                readOnly
                value="Username to invite"
                className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-500"
              />
              <div className="rounded-2xl bg-cyan-500 px-5 py-4 text-center text-sm font-medium text-slate-950">
                Send Invite
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="text-2xl font-semibold">Your Chats</div>
            <div className="mt-4 space-y-3">
              {chats?.length ? (
                chats.map((chat) => (
                  <div key={chat.chat_id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <div className="text-sm font-medium">{chat.title}</div>
                    <div className="mt-2 text-xs text-slate-500">
                      Members: {chat.member_count ?? 0}
                      {chat.latest_message_at ? ` • Latest activity: ${new Date(chat.latest_message_at).toLocaleString()}` : ""}
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
            <div className="text-2xl font-semibold">Pending Invites</div>
            <div className="mt-4 space-y-3">
              {invites?.length ? (
                invites.map((invite) => (
                  <div key={invite.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <div className="text-sm font-medium">Chat {invite.chat_id}</div>
                    <div className="mt-2 text-xs text-slate-500">
                      Invite created: {new Date(invite.created_at).toLocaleString()}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-2xl bg-emerald-500 px-4 py-3 text-center text-xs font-medium text-slate-950">
                        Accept
                      </div>
                      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-center text-xs text-rose-200">
                        Decline
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-400">No pending invites.</div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="text-2xl font-semibold">Commercial Chat Guidance</div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
                Separate strategy discussions from execution notes.
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
                Use invite acceptance so rooms remain intentional and trusted.
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
                Keep noise low: a commercial chat tool should help decisions, not distract from them.
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}