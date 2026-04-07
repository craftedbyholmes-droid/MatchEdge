import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { ChatShell } from "@/components/chat/chat-shell";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ChatPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: memberships } = await supabase
    .from("chat_members")
    .select("chat_id")
    .eq("user_id", user.id);

  const chatIds = (memberships || []).map((row) => row.chat_id);

  const { data: chats } = chatIds.length
    ? await supabase
        .from("chat_overview")
        .select("id, title, description, member_count, latest_message")
        .in("id", chatIds)
        .order("updated_at", { ascending: false })
    : { data: [] as any[] };

  const { data: invites } = await supabase
    .from("chat_invites")
    .select("id, status, chats(title), inviter:profiles!chat_invites_invited_by_user_id_fkey(username, display_name)")
    .eq("invited_user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <AppShell>
      <PageHeader
        eyebrow="Chat"
        title="Multi-chat collaboration with invite acceptance guard"
        description="Users can create multiple chats, invite by username, and only join after accepting an invite."
      />

      <ChatShell userId={user.id} chats={(chats || []) as any} invites={(invites || []) as any} />
    </AppShell>
  );
}