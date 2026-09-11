import type { Metadata } from "next";
import { ConversationStarter } from "@/features/conversation-starter/conversation-starter";

export const metadata: Metadata = {
  title: "Continue the Conversation · Project RESET",
  description: "Reflective questions inspired by Third Degree Burnout.",
};

export const dynamic = "force-dynamic";

export default function StartAConversationPage() {
  return <ConversationStarter />;
}
