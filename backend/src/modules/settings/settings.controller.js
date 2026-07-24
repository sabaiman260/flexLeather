import { asyncHandler } from "../../core/utils/async-handler.js";
import Settings from "../../models/Settings.model.js";
import { ApiResponse } from "../../core/utils/api-response.js";
import { ApiError } from "../../core/utils/api-error.js";

// GET /api/v1/settings  — public (cart & checkout need shipping cost)
export const getSettings = asyncHandler(async (_req, res) => {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({ shippingCost: 200, announcementText: '', announcementEnabled: false });
    return res.status(200).json(new ApiResponse(200, settings, "Settings fetched"));
});

// PUT /api/v1/settings  — admin only
export const updateSettings = asyncHandler(async (req, res) => {
    const { shippingCost, announcementText, announcementEnabled } = req.body;
    if (shippingCost === undefined || shippingCost === null) throw new ApiError(400, "shippingCost is required");
    if (typeof shippingCost !== "number" || shippingCost < 0) throw new ApiError(400, "shippingCost must be a non-negative number");
    if (announcementText !== undefined && typeof announcementText !== "string") throw new ApiError(400, "announcementText must be a string");
    if (announcementEnabled !== undefined && typeof announcementEnabled !== "boolean") throw new ApiError(400, "announcementEnabled must be a boolean");

    let settings = await Settings.findOne();
    if (!settings) {
        settings = await Settings.create({ shippingCost, announcementText: announcementText ?? '', announcementEnabled: !!announcementEnabled });
    } else {
        settings.shippingCost = shippingCost;
        if (announcementText !== undefined) settings.announcementText = announcementText;
        if (announcementEnabled !== undefined) settings.announcementEnabled = announcementEnabled;
        await settings.save();
    }
    return res.status(200).json(new ApiResponse(200, settings, "Settings updated"));
});
