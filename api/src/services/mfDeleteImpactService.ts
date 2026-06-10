import MFAmc from "../models/mfAmcModel";
import MFCategory from "../models/mfCategoryModel";
import MFFund from "../models/mfFundModel";
import MFIndexSnapshot from "../models/mfIndexSnapshotModel";
import MFMainCategory from "../models/mfMainCategoryModel";
import MFNfo from "../models/mfNfoModel";

export interface DeleteImpactItem {
  key: string;
  label: string;
  count: number;
}

export interface DeleteImpactSummary {
  entityType: "main-category" | "category" | "amc";
  entityId: string;
  entityName: string;
  items: DeleteImpactItem[];
  totalDependencies: number;
}

const buildSummary = (
  entityType: DeleteImpactSummary["entityType"],
  entityId: string,
  entityName: string,
  items: DeleteImpactItem[],
): DeleteImpactSummary => ({
  entityType,
  entityId,
  entityName,
  items,
  totalDependencies: items.reduce((sum, item) => sum + item.count, 0),
});

export const getMainCategoryDeleteImpact = async (
  id: string,
): Promise<DeleteImpactSummary> => {
  const doc = await MFMainCategory.findOne({ _id: id, is_deleted: false }).select(
    "name",
  );
  if (!doc) throw new Error("Main category not found");

  const categories = await MFCategory.find({
    main_category_id: id,
    is_deleted: false,
  })
    .select("_id")
    .lean();

  const categoryIds = categories.map((category) => category._id);
  const categoryFilter =
    categoryIds.length > 0 ? { category_id: { $in: categoryIds } } : null;

  const [fundCount, nfoCount, indexSnapshotCount] = await Promise.all([
    categoryFilter
      ? MFFund.countDocuments({ ...categoryFilter, is_deleted: false })
      : Promise.resolve(0),
    categoryFilter
      ? MFNfo.countDocuments({ ...categoryFilter, is_deleted: false })
      : Promise.resolve(0),
    MFIndexSnapshot.countDocuments({
      is_deleted: false,
      ...(categoryFilter
        ? {
            $or: [{ main_category_id: id }, categoryFilter],
          }
        : { main_category_id: id }),
    }),
  ]);

  return buildSummary("main-category", id, doc.name, [
    { key: "subcategories", label: "subcategories", count: categories.length },
    { key: "funds", label: "funds", count: fundCount },
    { key: "nfos", label: "NFOs", count: nfoCount },
    {
      key: "indexSnapshots",
      label: "index snapshots",
      count: indexSnapshotCount,
    },
  ]);
};

export const getCategoryDeleteImpact = async (
  id: string,
): Promise<DeleteImpactSummary> => {
  const doc = await MFCategory.findOne({ _id: id, is_deleted: false }).select(
    "name",
  );
  if (!doc) throw new Error("Category not found");

  const [fundCount, nfoCount, indexSnapshotCount] = await Promise.all([
    MFFund.countDocuments({ category_id: id, is_deleted: false }),
    MFNfo.countDocuments({ category_id: id, is_deleted: false }),
    MFIndexSnapshot.countDocuments({ category_id: id, is_deleted: false }),
  ]);

  return buildSummary("category", id, doc.name, [
    { key: "funds", label: "funds", count: fundCount },
    { key: "nfos", label: "NFOs", count: nfoCount },
    {
      key: "indexSnapshots",
      label: "index snapshots",
      count: indexSnapshotCount,
    },
  ]);
};

export const getAmcDeleteImpact = async (
  id: string,
): Promise<DeleteImpactSummary> => {
  const doc = await MFAmc.findOne({ _id: id, is_deleted: false }).select("name");
  if (!doc) throw new Error("AMC not found");

  const [fundCount, nfoCount] = await Promise.all([
    MFFund.countDocuments({ amc_id: id, is_deleted: false }),
    MFNfo.countDocuments({ amc_id: id, is_deleted: false }),
  ]);

  return buildSummary("amc", id, doc.name, [
    { key: "funds", label: "funds", count: fundCount },
    { key: "nfos", label: "NFOs", count: nfoCount },
  ]);
};
