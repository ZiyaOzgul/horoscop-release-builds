import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const savePalmistryAnalysis = mutation({
  args: {
    userId: v.string(),
    photoUri: v.optional(v.string()),
    analysis: v.object({
      summary: v.string(),
      details: v.string(),
      life_line: v.string(),
      heart_line: v.string(),
      fate_line: v.string(),
      hand_type: v.string(),
      result: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];

    const palmistryData = {
      userId: args.userId,
      photoUri: args.photoUri,
      analysis: args.analysis,
      createdAt: Date.now(),
      date: today,
    };

    return await ctx.db.insert("palmistries", palmistryData);
  },
});

export const getUserPalmistries = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const palmistries = await ctx.db
      .query("palmistries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc") // Most recent first
      .take(args.limit || 10);

    return palmistries;
  },
});

export const getPalmistryById = query({
  args: {
    palmistryId: v.id("palmistries"),
  },
  handler: async (ctx, args) => {
    const palmistry = await ctx.db.get(args.palmistryId);
    return palmistry;
  },
});

export const deletePalmistry = mutation({
  args: {
    palmistryId: v.id("palmistries"),
    userId: v.string(), // For security - ensure user owns the palmistry
  },
  handler: async (ctx, args) => {
    // First verify the palmistry belongs to the user
    const palmistry = await ctx.db.get(args.palmistryId);
    if (!palmistry || palmistry.userId !== args.userId) {
      throw new Error("Palmistry not found or unauthorized");
    }

    return await ctx.db.delete(args.palmistryId);
  },
});

