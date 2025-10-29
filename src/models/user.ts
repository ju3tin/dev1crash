import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  username: string;
  walletAddress?: string;
}

const UserSchema = new Schema<IUser>({
    username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  walletAddress: { type: String, unique: true, sparse: true },
});

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
