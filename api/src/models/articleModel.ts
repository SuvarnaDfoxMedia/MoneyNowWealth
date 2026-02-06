// import mongoose, { Document, Schema, Model } from "mongoose";

// /* ===============================
//    Interface
//    =============================== */

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

//   faqs?: {
//     question: string;
//     answer: string;
//   }[];

//   tools?: {
//     title: string;
//     content: string;
//   }[];

//   related_reads?: {
//     title: string;
//     content: string;
//   }[];

//   status: "draft" | "published" | "archived";
//   read_time?: number;
//   author?: string;
//   is_active: number;
//   is_deleted: boolean;

//   // ADDED: Publish date for scheduled publishing
//   publish_date?: Date;

//   // EMAIL NOTIFICATION - Ensures same article email sent only once
//   // Reset to false when status changes back to draft/archived
//   is_email_sent?: boolean;

//   deleted_at?: Date;
//   created_at: Date;
//   updated_at: Date;
// }

// /* ===============================
//    Schema
//    =============================== */

// const articleSchema = new Schema<IArticle>(
//   {
//     topic_id: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Topic",
//       required: true,
//     },

//     article_code: {
//       type: String,
//       trim: true,
//       unique: true,
//     },

//     title: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     slug: {
//       type: String,
//       required: true,
//       trim: true,
//       lowercase: true,
//       unique: true,
//     },

//     hero_image: {
//       type: String,
//       trim: true,
//     },

//     seo_title: {
//       type: String,
//       trim: true,
//     },

//     seo_description: {
//       type: String,
//       trim: true,
//     },

//     focus_keyword: {
//       type: String,
//       trim: true,
//     },

//     introduction: {
//       type: String,
//       default: "",
//     },

//     sections: [
//       {
//         title: {
//           type: String,
//           trim: true,
//         },
//         content: {
//           type: String,
//           default: "",
//         },
//         images: [
//           {
//             url: { type: String, trim: true },
//             caption: { type: String, trim: true },
//           },
//         ],
//         videos: [
//           {
//             url: { type: String, trim: true },
//             title: { type: String, trim: true },
//           },
//         ],
//       },
//     ],

//     faqs: [
//       {
//         question: { type: String, trim: true },
//         answer: { type: String, default: "" },
//       },
//     ],

//     tools: [
//       {
//         title: { type: String, trim: true, required: true },
//         content: { type: String, default: "" },
//       },
//     ],

//     related_reads: [
//       {
//         title: { type: String, trim: true, required: true },
//         content: { type: String, default: "" },
//       },
//     ],

//     /* =============================== */

//     status: {
//       type: String,
//       enum: ["draft", "published", "archived"],
//       default: "draft",
//     },

//     // ADDED: Publish date for scheduling
//     publish_date: {
//       type: Date,
//       default: null,
//       index: true,
//     },

//     read_time: {
//       type: Number,
//       default: 0,
//     },

//     author: {
//       type: String,
//       trim: true,
//     },

//     is_active: {
//       type: Number,
//       default: 1,
//     },

//     is_deleted: {
//       type: Boolean,
//       default: false,
//     },

//     // Track if email notification has been sent for this article
//     // IMPORTANT: Prevents duplicate emails on restart/retry
//     is_email_sent: {
//       type: Boolean,
//       default: false,
//       index: true,
//     },

//     deleted_at: {
//       type: Date,
//       default: null,
//     },
//   },
//   {
//     versionKey: false,
//     timestamps: {
//       createdAt: "created_at",
//       updatedAt: "updated_at",
//     },
//   },
// );

// /* ===============================
//    Pre-save Hook
//    =============================== */

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

//   // Auto calculate read time
//   if (this.introduction || this.sections?.length) {
//     const text = [
//       this.introduction,
//       ...(this.sections || []).map((s) => s.content || ""),
//     ].join(" ");

//     const words = text.trim().split(/\s+/).length;
//     this.read_time = Math.max(1, Math.ceil(words / 200));
//   }
// });

// /* ===============================
//    Model Export
//    =============================== */

// const Article: Model<IArticle> =
//   mongoose.models.Article || mongoose.model<IArticle>("Article", articleSchema);

// export default Article;

import mongoose, { Document, Schema, Model } from "mongoose";
import { capitalizePlugin } from "../plugins/capitalize.plugin";

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

  // ADDED: Publish date for scheduled publishing
  publish_date?: Date;

  // EMAIL NOTIFICATION - Ensures same article email sent only once
  // Reset to false when status changes back to draft/archived
  is_email_sent?: boolean;

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

    // ADDED: Publish date for scheduling
    publish_date: {
      type: Date,
      default: null,
      index: true,
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

    // Track if email notification has been sent for this article
    // IMPORTANT: Prevents duplicate emails on restart/retry
    is_email_sent: {
      type: Boolean,
      default: false,
      index: true,
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
  },
);

/* ===============================
   Capitalization Plugin
   =============================== */
articleSchema.plugin(capitalizePlugin, {
  except: [
    // SEO/slug fields
    "slug",
    "article_code",
    "hero_image",
    "seo_title",
    "seo_description",
    "focus_keyword",

    // Enum fields
    "status",

    // Number fields
    "read_time",
    "is_active",

    // Boolean fields
    "is_deleted",
    "is_email_sent",

    // Date fields
    "publish_date",
    "deleted_at",
    "created_at",
    "updated_at",

    // ObjectId fields
    "topic_id",

    // MongoDB internal fields
    "_id",
    "__v",
  ],
  descriptionFields: [
    "introduction",
    "sections.content",
    "faqs.answer",
    "tools.content",
    "related_reads.content",
  ],
});

/* ===============================
   Pre-save Hook
   =============================== */

articleSchema.pre<IArticle>("save", async function (next) {
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

  next();
});

/* ===============================
   Model Export
   =============================== */

const Article: Model<IArticle> =
  mongoose.models.Article || mongoose.model<IArticle>("Article", articleSchema);

export default Article;
