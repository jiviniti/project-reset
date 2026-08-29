export type EntryPathway = "event" | "non_event";

export type RewardType = "film_access" | "trailer_access";

export type EventWindowStatus =
  | "active_event"
  | "event_not_started"
  | "event_expired"
  | "non_event";

export type PathwayResolution = {
  entryPathway: EntryPathway;
  rewardType: RewardType;
  eventWindowStatus: EventWindowStatus;
  accessEndsAt: string | null;
};

export type SubmissionResult = PathwayResolution & {
  submissionId: string;
  participationId: string;
  rewardDeliveryId: string | null;
  status: "completed";
  replayed: boolean;
};
