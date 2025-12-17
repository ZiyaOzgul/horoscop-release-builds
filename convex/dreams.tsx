import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const saveDreamAnalysis = mutation({
  args: {
    userId: v.string(),
    dreamDescription: v.string(),
    symbols: v.array(
      v.object({
        symbol: v.string(),
        meanings: v.array(v.string()),
      })
    ),
    overallMessage: v.string(),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];

    const dreamData = {
      userId: args.userId,
      dreamDescription: args.dreamDescription,
      symbols: args.symbols,
      overallMessage: args.overallMessage,
      createdAt: Date.now(),
      date: today,
    };

    return await ctx.db.insert("dreams", dreamData);
  },
});

export const getUserDreams = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const dreams = await ctx.db
      .query("dreams")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc") // Most recent first
      .take(args.limit || 10);

    return dreams;
  },
});

export const getDreamById = query({
  args: {
    dreamId: v.id("dreams"),
  },
  handler: async (ctx, args) => {
    const dream = await ctx.db.get(args.dreamId);
    return dream;
  },
});

export const getTodaysDream = query({
  args: {
    userId: v.string(),
    date: v.string(), // Format: "YYYY-MM-DD"
  },
  handler: async (ctx, args) => {
    const dream = await ctx.db
      .query("dreams")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    return dream;
  },
});

export const deleteDream = mutation({
  args: {
    dreamId: v.id("dreams"),
    userId: v.string(), // For security - ensure user owns the dream
  },
  handler: async (ctx, args) => {
    // First verify the dream belongs to the user
    const dream = await ctx.db.get(args.dreamId);
    if (!dream || dream.userId !== args.userId) {
      throw new Error("Dream not found or unauthorized");
    }

    return await ctx.db.delete(args.dreamId);
  },
});
