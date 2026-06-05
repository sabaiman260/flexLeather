import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
    shippingCost: { type: Number, default: 200, min: 0 },
}, { timestamps: true });

// Only one settings document ever exists — use upsert pattern
const Settings = mongoose.model("Settings", settingsSchema);
export default Settings;
