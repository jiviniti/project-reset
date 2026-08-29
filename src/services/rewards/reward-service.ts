export type RewardDeliveryRequest = {
  rewardDeliveryId: string;
  channel: "email";
  rewardType: "film_access";
  accessEndsAt: string;
};

export interface RewardService {
  deliver(request: RewardDeliveryRequest): Promise<{ status: "deferred" }>;
}

export class DisabledRewardService implements RewardService {
  async deliver(): Promise<{ status: "deferred" }> {
    return { status: "deferred" };
  }
}
