// src/services/newsletterService.ts
import { Newsletter, type INewsletter } from "../models/newsletterModel";

/* ---------------------------------------------------
   Get paginated newsletters
--------------------------------------------------- */
export const getNewsletters = async (query: any) => {
  const { search, includeDeleted, page, limit, sort } = query;

  const filter: any = {};

  // Only non-deleted by default
  if (!includeDeleted) filter.is_deleted = false;

  // Search by name or email (case-insensitive)
  if (search) {
    const s = String(search).trim();
    filter.$or = [
      { name: { $regex: s, $options: "i" } },
      { email: { $regex: s, $options: "i" } },
    ];
  }

  const pageNum = Math.max(Number(page) || 1, 1);
  const perPage = Math.max(Number(limit) || 10, 1);
  const skip = (pageNum - 1) * perPage;

  const finalSort = sort || { created_at: -1 };

  const [newsletters, total] = await Promise.all([
    Newsletter.find(filter).sort(finalSort).skip(skip).limit(perPage),
    Newsletter.countDocuments(filter),
  ]);

  return {
    success: true,
    newsletters,
    total,
    currentPage: pageNum,
    limit: perPage,
    totalPages: Math.ceil(total / perPage),
  };
};

/* ---------------------------------------------------
   Get one subscriber by ID
--------------------------------------------------- */
export const getNewsletterById = async (id: string) => {
  const newsletter = await Newsletter.findOne({ _id: id, is_deleted: false });
  if (!newsletter) throw new Error("Subscriber not found");
  return newsletter;
};

/* ---------------------------------------------------
   Create a new subscriber
--------------------------------------------------- */
export const createNewsletter = async (data: Partial<INewsletter>) => {
  if (!data.email) {
    throw new Error("Email is required");
  }

  if (!data.is_terms_accepted) {
    throw new Error("Terms must be accepted");
  }

  const cleanEmail = data.email.trim().toLowerCase();

  const newsletter = new Newsletter({
    name: data.name ?? null,
    email: cleanEmail,
    is_terms_accepted: true,
  });

  try {
    await newsletter.save();
    return newsletter;
  } catch (err: any) {
    if (err.code === 11000) {
      throw new Error("Email is already subscribed");
    }
    throw err;
  }
};

/* ---------------------------------------------------
   Soft delete subscriber by ID
--------------------------------------------------- */
export const deleteNewsletter = async (id: string) => {
  const subscriber = await Newsletter.findById(id);
  if (!subscriber) throw new Error("Subscriber not found");

  subscriber.is_deleted = true;
  subscriber.deleted_at = new Date();

  await subscriber.save();
  return subscriber;
};