import mongoose, { Schema, Model, Document } from 'mongoose';

type Point = { x: number; y: number };

export interface ControlPointDoc extends Document {
  cp1: Point;
  cp2: Point;
  pointB: Point;
  time: number;
  num: number;
}

const PointSchema = new Schema<Point>({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
}, { _id: false });

const ControlPointSchema = new Schema<ControlPointDoc>({
  cp1: { type: PointSchema, required: true },
  cp2: { type: PointSchema, required: true },
  pointB: { type: PointSchema, required: true },
  num: { type: Number, required: true },
  time: { type: Number, required: true },
}, { _id: false });

export interface BezierSetDoc extends Document {
  key: string;
  frames: ControlPointDoc[];
  updatedAt: Date;
}

const BezierSetSchema = new Schema<BezierSetDoc>({
  key: { type: String, required: true, unique: true },
  frames: { type: [ControlPointSchema], required: true, default: [] },
}, { timestamps: true });

export const BezierSet: Model<BezierSetDoc> = mongoose.models.BezierSet || mongoose.model<BezierSetDoc>('BezierSet', BezierSetSchema);


