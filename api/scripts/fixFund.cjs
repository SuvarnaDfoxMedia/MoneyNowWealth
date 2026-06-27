const fs = require('fs'); 
const file = 'src/models/mfFundModel.ts'; 
let content = fs.readFileSync(file, 'utf8'); 
const prefix = `import mongoose, { Document, Schema, Model } from "mongoose";

const yearValueMapField = { type: Map, of: Number, default: () => ({}) };
const trailingReturnsSchema = new Schema(
  {
    "1w": { type: Number, default: null },
    "1m": { type: Number, default: null },
    "3m": { type: Number, default: null },
    "6m": { type: Number, default: null },
    "1y": { type: Number, default: null },
    "2y": { type: Number, default: null },
    "3y": { type: Number, default: null },
    "5y": { type: Number, default: null },
    "10y": { type: Number, default: null },
    since_launch: { type: Number, default: null },
    ytd: { type: Number, default: null },
  },
  { _id: false },
);
const annualReturnsSchema = new Schema(
  {
    ytd: { type: Number, default: null },
    yearly_returns: yearValueMapField,
  },
  { _id: false },
);
const fundReturnsSchema = new Schema(
  {
    d1: { type: Number, default: null },
    since_inception: { type: Number, default: null },
    trailing: { type: trailingReturnsSchema, default: () => ({}) },
    annual: { type: annualReturnsSchema, default: () => ({}) },
  },
  { _id: false },
);

const frontendVisibilitySchema = new Schema(
  {
    groups: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
    fields: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  { _id: false },
);

`; 
content = prefix + content.substring(content.indexOf('export interface IMFFund')); 
fs.writeFileSync(file, content);
