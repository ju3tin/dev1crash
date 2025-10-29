import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITweetSubmission extends Document {
  walletAddress: string;
  tweet: string;
  date: Date;
}

const TweetSubmissionSchema: Schema = new Schema({
  walletAddress: { type: String, required: true },
  tweet: { type: String, required: true },
  date: { type: Date, required: true },
});

export const TweetSubmission: Model<ITweetSubmission> =
  mongoose.models.TweetSubmission ||
  mongoose.model<ITweetSubmission>('TweetSubmission', TweetSubmissionSchema);
