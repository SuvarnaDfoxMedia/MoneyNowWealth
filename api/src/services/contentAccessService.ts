import { userSubscriptionService } from "@/services/userSubscriptionService";

export const contentAccessService = {
  async hasPremiumBlogAccess(userId?: string | null) {
    if (!userId) return false;

    const subscription = await userSubscriptionService.getByUserId(userId);
    if (!subscription) return false;

    if (typeof (subscription as any).canAccessPremiumContent === "function") {
      return (subscription as any).canAccessPremiumContent();
    }

    return (
      subscription.plan_type === "Premium" &&
      subscription.status !== "expired" &&
      subscription.is_active === true &&
      subscription.is_deleted === false
    );
  },

  async getAllowedTopicAccessTypes(userId?: string | null) {
    const canAccessPremium = await this.hasPremiumBlogAccess(userId);
    return canAccessPremium ? ["free", "premium"] : ["free"];
  },
};
