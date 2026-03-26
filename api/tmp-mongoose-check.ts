import mongoose from "mongoose";
type TDoc = mongoose.Document;
type TModel<T> = mongoose.Model<T>;
type TObjectId = mongoose.Types.ObjectId;
const schema = new mongoose.Schema<{ name: string }>({ name: String });
const User = mongoose.model("User", schema);
const ok = mongoose.connect;
