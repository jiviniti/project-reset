export type RewardDeliveryRequest = {
  rewardDeliveryId: string;
  channel: "email";
};

export interface RewardService {
  deliver(request: RewardDeliveryRequest): Promise<{ status: "deferred" }>;
}

export class DisabledRewardService implements RewardService {
  async deliver(): Promise<{ status: "deferred" }> {
    return { status: "deferred" };
  }
}
