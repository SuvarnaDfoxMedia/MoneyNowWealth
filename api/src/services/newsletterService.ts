import { Newsletter, type INewsletter } from "../models/newsletterModel";

/* ---------------------------------------------------
   Get paginated newsletters
--------------------------------------------------- */
export const getNewsletters = async (query: any) => {
  const { search, includeDeleted, page, limit, sort } = query;

  const filter: any = {};

  if (!includeDeleted) filter.is_deleted = false;

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
   Get one subscriber
--------------------------------------------------- */
export const getNewsletterById = async (id: string) => {
  const newsletter = await Newsletter.findOne({ _id: id, is_deleted: false });
  if (!newsletter) throw new Error("Newsletter not found");
  return newsletter;
};

/* ---------------------------------------------------
   Add a newsletter subscriber
--------------------------------------------------- */
export const createNewsletter = async (data: Partial<INewsletter>) => {
  const { name, email } = data;

  const newsletter = new Newsletter({
    name,
    email,
  });

  await newsletter.save();
  return newsletter;
};

/* ---------------------------------------------------
   Soft delete subscriber
--------------------------------------------------- */
export const deleteNewsletter = async (id: string) => {
  const subscriber = await Newsletter.findById(id);
  if (!subscriber) throw new Error("Subscriber not found");

  subscriber.is_deleted = true;
  subscriber.deleted_at = new Date();

  await subscriber.save();
  return subscriber;
};
