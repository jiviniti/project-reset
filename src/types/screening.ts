import type { PathwayResolution } from "@/types/pathway";

export type QuestionOption = {
  key: string;
  label: string;
  position: number;
  parentOptionKey?: string;
};

export type QuestionnaireQuestion = {
  key: string;
  prompt: string;
  answerType: "single_choice" | "multi_choice" | "text";
  position: number;
  required: boolean;
  options: QuestionOption[];
};

export type ScreeningConfig = PathwayResolution & {
  slug: string;
  name: string;
  institution: string | null;
  eventDate: string | null;
  questionnaireKey: string;
  questionnaireVersion: number;
  policyVersion: string;
  policyText: string;
  checkInOpensAt: string | null;
  checkInClosesAt: string | null;
  questions: QuestionnaireQuestion[];
};
