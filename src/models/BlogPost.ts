import mongoose, { Schema, Model } from 'mongoose';

export interface IBlogPost {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: mongoose.Types.ObjectId;
  authorSnapshot: {
    name: string;
    email: string;
  };
  tags: string[];
  status: 'draft' | 'published';
  publishedAt: Date | null;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const blogPostSchema = new Schema<IBlogPost>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, default: '', maxlength: 500 },
    content: { type: String, required: true },
    coverImage: { type: String, default: '' },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorSnapshot: {
      name: { type: String, required: true },
      email: { type: String, required: true },
    },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    publishedAt: { type: Date, default: null },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

blogPostSchema.index({ slug: 1 });
blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ tags: 1 });

const BlogPost: Model<IBlogPost> =
  mongoose.models.BlogPost || mongoose.model<IBlogPost>('BlogPost', blogPostSchema);
export default BlogPost;
