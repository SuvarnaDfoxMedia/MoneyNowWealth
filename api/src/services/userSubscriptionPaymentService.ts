import mongoose from "mongoose";
import UserSubscriptionPayment from "@/models/userSubscriptionPaymentModel";

export const userSubscriptionPaymentService = {
  async create(data: any) {
    const payment = new UserSubscriptionPayment(data);
    return payment.save();
  },

  async update(id: string, data: any) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return UserSubscriptionPayment.findByIdAndUpdate(id, data, { new: true });
  },

  async getById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return UserSubscriptionPayment.findById(id).populate(
      "plan_id user_subscription_id",
    );
  },

  async getPaymentsByUser(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) return [];

    return UserSubscriptionPayment.find({
      user_id: new mongoose.Types.ObjectId(userId),
    })
      .populate("plan_id", "name price duration")
      .populate("user_subscription_id", "status plan_type end_date")
      .sort({ payment_date: -1 })
      .lean();
  },

  async getLatestBySubscriptionId(subscriptionId: string) {
    if (!mongoose.Types.ObjectId.isValid(subscriptionId)) return null;

    return UserSubscriptionPayment.findOne({
      user_subscription_id: new mongoose.Types.ObjectId(subscriptionId),
    })
      .sort({ payment_date: -1 })
      .populate("plan_id", "name price duration")
      .lean();
  },
};
