import type { InferUITools, UIDataTypes, UIMessage } from "ai";
import type { AssistantTools } from "@/lib/assistant/tools";

export type DotMessage = UIMessage<never, UIDataTypes, InferUITools<AssistantTools>>;

/** A listing draft handed from the assistant to the sell form. */
export type ListingDraft = {
  title: string;
  description: string;
  category: string;
  condition?: string;
  price?: number;
};

export const DRAFT_EVENT = "stoop:listing-draft";
export const DRAFT_STORAGE_KEY = "stoop-listing-draft";
