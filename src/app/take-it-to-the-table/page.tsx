import type { Metadata } from "next";
import { ConversationStarter } from "@/features/conversation-starter/conversation-starter";

export const metadata: Metadata = {
  title: "Take It to the Table · Project RESET",
  description: "A guided conversation companion inspired by Third Degree Burnout.",
  robots: { index: false, follow: false },
};

export default function TakeItToTheTablePage() {
  return <ConversationStarter />;
}
