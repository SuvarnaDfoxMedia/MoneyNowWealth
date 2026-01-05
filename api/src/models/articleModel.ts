// import mongoose, { Document, Schema, Model } from "mongoose";

// export interface IArticle extends Document {
//   topic_id: mongoose.Types.ObjectId;
//   article_code?: string;
//   title: string;
//   slug: string;
//   hero_image?: string;
//   seo_title?: string;
//   seo_description?: string;
//   focus_keyword?: string;
//   introduction?: string;
//   sections?: {
//     title?: string;
//     content?: string;
//     images?: { url: string; caption?: string }[];
//     videos?: { url: string; title?: string }[];
//   }[];
//   faqs?: { question: string; answer: string }[];
//   tools?: { name: string; url: string }[];
//   related_reads?: { topic_code?: string; title?: string }[];
//   status: "draft" | "published" | "archived";
//   read_time?: number;
//   author?: string;
//   is_active: number;
//   is_deleted: boolean;
//   deleted_at?: Date;
//   created_at: Date;
//   updated_at: Date;
// }

// const articleSchema = new Schema<IArticle>(
//   {
//     topic_id: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", required: true },
//     article_code: { type: String, trim: true, unique: true },
//     title: { type: String, required: true, trim: true },
//     slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
//     hero_image: { type: String, trim: true },
//     seo_title: { type: String, trim: true },
//     seo_description: { type: String, trim: true },
//     focus_keyword: { type: String, trim: true },
//     introduction: { type: String, default: "" },
//     sections: [
//       {
//         title: { type: String, trim: true },
//         content: { type: String, default: "" },
//         images: [{ url: { type: String, trim: true }, caption: { type: String, trim: true } }],
//         videos: [{ url: { type: String, trim: true }, title: { type: String, trim: true } }],
//       },
//     ],
//     faqs: [{ question: { type: String, trim: true }, answer: { type: String, default: "" } }],
//     tools: [{ name: { type: String, trim: true }, url: { type: String, trim: true } }],
//     related_reads: [{ topic_code: { type: String, trim: true }, title: { type: String, trim: true } }],
//     status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
//     read_time: { type: Number, default: 0 },
//     author: { type: String, trim: true },
//     is_active: { type: Number, default: 1 },
//     is_deleted: { type: Boolean, default: false },
//     deleted_at: { type: Date, default: null },
//   },
//   { versionKey: false, timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
// );

// // Async pre-save hook (no next)
// articleSchema.pre<IArticle>("save", async function () {
//   if (!this.article_code) {
//     const lastArticle = await Article.findOne({ article_code: /^ART\d+$/ })
//       .sort({ article_code: -1 })
//       .select("article_code");
//     let newCodeNumber = 1;
//     if (lastArticle?.article_code) {
//       const match = lastArticle.article_code.match(/\d+$/);
//       if (match) newCodeNumber = parseInt(match[0], 10) + 1;
//     }
//     this.article_code = `ART${String(newCodeNumber).padStart(4, "0")}`;
//   }

//   if (this.introduction || this.sections?.length) {
//     const text = [this.introduction, ...(this.sections || []).map((s) => s.content || "")].join(" ");
//     const words = text.trim().split(/\s+/).length;
//     this.read_time = Math.max(1, Math.ceil(words / 200));
//   }
// });

// const Article: Model<IArticle> = mongoose.model<IArticle>("Article", articleSchema);
// export default Article;


import mongoose, { Document, Schema, Model } from "mongoose";

/* ===============================
   Interface
   =============================== */

export interface IArticle extends Document {
  topic_id: mongoose.Types.ObjectId;
  article_code?: string;
  title: string;
  slug: string;
  hero_image?: string;
  seo_title?: string;
  seo_description?: string;
  focus_keyword?: string;
  introduction?: string;

  sections?: {
    title?: string;
    content?: string;
    images?: { url: string; caption?: string }[];
    videos?: { url: string; title?: string }[];
  }[];

  faqs?: {
    question: string;
    answer: string;
  }[];

  tools?: {
    title: string;
    content: string;
  }[];

  related_reads?: {
    title: string;
    content: string;
  }[];

  status: "draft" | "published" | "archived";
  read_time?: number;
  author?: string;
  is_active: number;
  is_deleted: boolean;
  deleted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

/* ===============================
   Schema
   =============================== */

const articleSchema = new Schema<IArticle>(
  {
    topic_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },

    article_code: {
      type: String,
      trim: true,
      unique: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },

    hero_image: {
      type: String,
      trim: true,
    },

    seo_title: {
      type: String,
      trim: true,
    },

    seo_description: {
      type: String,
      trim: true,
    },

    focus_keyword: {
      type: String,
      trim: true,
    },

    introduction: {
      type: String,
      default: "",
    },

    sections: [
      {
        title: {
          type: String,
          trim: true,
        },
        content: {
          type: String,
          default: "",
        },
        images: [
          {
            url: { type: String, trim: true },
            caption: { type: String, trim: true },
          },
        ],
        videos: [
          {
            url: { type: String, trim: true },
            title: { type: String, trim: true },
          },
        ],
      },
    ],

    faqs: [
      {
        question: { type: String, trim: true },
        answer: { type: String, default: "" },
      },
    ],

    /* ===============================
       UPDATED FIELDS
       =============================== */

    tools: [
      {
        title: { type: String, trim: true, required: true },
        content: { type: String, default: "" },
      },
    ],

    related_reads: [
      {
        title: { type: String, trim: true, required: true },
        content: { type: String, default: "" },
      },
    ],

    /* =============================== */

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },

    read_time: {
      type: Number,
      default: 0,
    },

    author: {
      type: String,
      trim: true,
    },

    is_active: {
      type: Number,
      default: 1,
    },

    is_deleted: {
      type: Boolean,
      default: false,
    },

    deleted_at: {
      type: Date,
      default: null,
    },
  },
  {
    versionKey: false,
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

/* ===============================
   Pre-save Hook
   =============================== */

articleSchema.pre<IArticle>("save", async function () {
  if (!this.article_code) {
    const lastArticle = await Article.findOne({ article_code: /^ART\d+$/ })
      .sort({ article_code: -1 })
      .select("article_code");

    let newCodeNumber = 1;

    if (lastArticle?.article_code) {
      const match = lastArticle.article_code.match(/\d+$/);
      if (match) newCodeNumber = parseInt(match[0], 10) + 1;
    }

    this.article_code = `ART${String(newCodeNumber).padStart(4, "0")}`;
  }

  // Auto calculate read time
  if (this.introduction || this.sections?.length) {
    const text = [
      this.introduction,
      ...(this.sections || []).map((s) => s.content || ""),
    ].join(" ");

    const words = text.trim().split(/\s+/).length;
    this.read_time = Math.max(1, Math.ceil(words / 200));
  }
});

/* ===============================
   Model Export
   =============================== */

const Article: Model<IArticle> =
  mongoose.models.Article ||
  mongoose.model<IArticle>("Article", articleSchema);

export default Article;


