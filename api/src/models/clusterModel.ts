// import mongoose, { Document, Schema, Model, Query } from "mongoose";
// import { createRequire } from "module";

// const require = createRequire(import.meta.url);
// const AutoIncrementFactory = require("mongoose-sequence");
// const AutoIncrement = AutoIncrementFactory(mongoose);

// /* -----------------------------
// Cluster Interface
// ----------------------------- */
// export interface ICluster extends Document {
// _id: mongoose.Types.ObjectId;
// cluster_code: string;
// cluster_number?: number;
// title: string;
// description?: string;
// thumbnail?: string;
// sort_order?: number;
// status: "draft" | "published" | "archived";
// is_active: number;
// is_deleted: boolean;
// created_at: Date;
// updated_at: Date;
// deleted_at?: Date;
// }

// /* -----------------------------
// Schema Definition
// ----------------------------- */
// const clusterSchema = new Schema<ICluster>(
// {
// cluster_code: { type: String, unique: true, index: true },
// title: { type: String, required: true, trim: true },
// description: { type: String, trim: true },
// thumbnail: { type: String, trim: true, default: "" },
// sort_order: { type: Number, default: 0, index: true },
// status: {
// type: String,
// enum: ["draft", "published", "archived"],
// default: "draft",
// index: true,
// },
// is_active: { type: Number, default: 1 },
// is_deleted: { type: Boolean, default: false },
// deleted_at: { type: Date, default: null },
// },
// {
// versionKey: false,
// timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
// }
// );

// /* -----------------------------
// Auto Increment Plugin
// ----------------------------- */
// clusterSchema.plugin(AutoIncrement, {
// id: "cluster_seq",
// inc_field: "cluster_number",
// start_seq: 1,
// });

// /* -----------------------------
// Pre-save hook (generate cluster_code)
// ----------------------------- */
// clusterSchema.post<ICluster>("save", function (doc) {
//   if (!doc.cluster_code && doc.cluster_number !== undefined) {
//     const number = String(doc.cluster_number).padStart(4, "0");
//     doc.cluster_code = `CL${number}`;
//     doc.save(); // triggers a second save safely
//   }
// });


// /* -----------------------------
// Static method: Soft Delete
// ----------------------------- */
// interface ClusterModel extends Model<ICluster> {
// softDelete(id: string): Promise<ICluster>;
// }

// clusterSchema.statics.softDelete = async function (id: string): Promise<ICluster> {
// const cluster = await this.findById(id);
// if (!cluster) throw new Error("Cluster not found");

// cluster.is_deleted = true;
// cluster.is_active = 0;
// cluster.deleted_at = new Date();
// await cluster.save();
// return cluster;
// };

// /* -----------------------------
// Pre-find: exclude soft deleted
// ----------------------------- */
// clusterSchema.pre<Query<ICluster[], ICluster>>(/^find/, function () {
// this.where({ is_deleted: false });
// });

// /* -----------------------------
// Pre deleteOne: soft delete
// ----------------------------- */
// clusterSchema.pre("deleteOne", { document: true, query: false }, async function () {
// this.is_deleted = true;
// this.is_active = 0;
// this.deleted_at = new Date();
// await this.save();
// });

// /* -----------------------------
// Indexes
// ----------------------------- */
// clusterSchema.index({ is_active: 1, is_deleted: 1, status: 1, sort_order: 1 });

// /* -----------------------------
// Model Export
// ----------------------------- */
// const Cluster: ClusterModel = mongoose.model<ICluster, ClusterModel>("Cluster", clusterSchema);
// export default Cluster;


import mongoose, { Document, Schema, Model, Query } from "mongoose";
import { createRequire } from "module";
import slugify from "slugify";

const require = createRequire(import.meta.url);
const AutoIncrementFactory = require("mongoose-sequence");
const AutoIncrement = AutoIncrementFactory(mongoose);

/* -----------------------------
Cluster Interface
----------------------------- */
export interface ICluster extends Document {
  _id: mongoose.Types.ObjectId;
  cluster_code: string;
  cluster_number?: number;
  title: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  sort_order?: number;
  status: "draft" | "published" | "archived";
  is_active: number;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

/* -----------------------------
Schema Definition
----------------------------- */
const clusterSchema = new Schema<ICluster>(
  {
    cluster_code: { type: String, unique: true, index: true },
    cluster_number: { type: Number, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true },
    thumbnail: { type: String, trim: true, default: "" },
    sort_order: { type: Number, default: 0, index: true },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    is_active: { type: Number, default: 1 },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
  },
  {
    versionKey: false,
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

/* -----------------------------
Auto Increment Plugin
----------------------------- */
clusterSchema.plugin(AutoIncrement, {
  id: "cluster_seq",
  inc_field: "cluster_number",
  start_seq: 1,
});

/* -----------------------------
Pre-save hook: Generate slug from title if missing
----------------------------- */
clusterSchema.pre<ICluster>("save", async function (next) {
  if (this.title) {
    let baseSlug = slugify(this.title, { lower: true, strict: true });
    let slug = baseSlug;

    // If cluster_number exists, append it to avoid duplicates
    if (this.cluster_number) slug = `${baseSlug}-${this.cluster_number}`;

    // Check if slug is unique
    const existing = await mongoose.models.Cluster.findOne({ slug, _id: { $ne: this._id } });
    if (existing) slug = `${slug}-${Date.now()}`; // fallback unique

    this.slug = slug;
  }
  next();
});

/* -----------------------------
Post-save hook: Generate cluster_code if missing
----------------------------- */
clusterSchema.post<ICluster>("save", function (doc) {
  if (!doc.cluster_code && doc.cluster_number !== undefined) {
    const number = String(doc.cluster_number).padStart(4, "0");
    doc.cluster_code = `CL${number}`;
    doc.save(); // safe second save
  }
});

/* -----------------------------
Static method: Soft Delete
----------------------------- */
interface ClusterModel extends Model<ICluster> {
  softDelete(id: string): Promise<ICluster>;
}

clusterSchema.statics.softDelete = async function (id: string): Promise<ICluster> {
  const cluster = await this.findById(id);
  if (!cluster) throw new Error("Cluster not found");

  cluster.is_deleted = true;
  cluster.is_active = 0;
  cluster.deleted_at = new Date();
  await cluster.save();
  return cluster;
};

/* -----------------------------
Pre-find: Exclude soft deleted
----------------------------- */
clusterSchema.pre<Query<ICluster[], ICluster>>(/^find/, function () {
  this.where({ is_deleted: false });
});

/* -----------------------------
Pre deleteOne: soft delete
----------------------------- */
clusterSchema.pre("deleteOne", { document: true, query: false }, async function () {
  this.is_deleted = true;
  this.is_active = 0;
  this.deleted_at = new Date();
  await this.save();
});

/* -----------------------------
Indexes
----------------------------- */
clusterSchema.index({ is_active: 1, is_deleted: 1, status: 1, sort_order: 1, slug: 1 });

/* -----------------------------
Model Export
----------------------------- */
const Cluster: ClusterModel = mongoose.model<ICluster, ClusterModel>("Cluster", clusterSchema);
export default Cluster;
