import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const User = {
  clerkId: v.string(),
  email: v.string(),
  gender: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  birthTime: v.optional(v.string()),
  birthDate: v.optional(v.string()),
  city: v.optional(v.string()),
  sunSign: v.optional(v.string()),
  moonSign: v.optional(v.string()),
  ascendant: v.optional(v.string()),
  element: v.optional(v.string()),
  polarity: v.optional(v.string()),
  modality: v.optional(v.string()),
  userType: v.optional(v.string()),
  profilePictureId: v.optional(v.id("_storage")),

  subscriptionStatus: v.optional(v.string()), // "active", "expired", "canceled", "trial"
  revenueCatUserId: v.optional(v.string()),
  subscriptionStartDate: v.optional(v.number()), // timestamp
  subscriptionEndDate: v.optional(v.number()), // timestamp
  lastSubscriptionCheck: v.optional(v.number()), // timestamp
};

export const HoroscopeData = {
  userId: v.string(),
  date: v.string(),
  daily: v.object({
    sunSign: v.string(),
    love: v.object({
      percentage: v.number(),
      explanation: v.string(),
    }),
    career: v.object({
      percentage: v.number(),
      explanation: v.string(),
    }),
    luck: v.object({
      percentage: v.number(),
      explanation: v.string(),
    }),
    health: v.object({
      percentage: v.number(),
      explanation: v.string(),
    }),
  }),
  weekly: v.object({
    sunSign: v.string(),
    love: v.object({
      percentage: v.number(),
      explanation: v.optional(v.string()),
    }),
    career: v.object({
      percentage: v.number(),
      explanation: v.optional(v.string()),
    }),
    luck: v.object({
      percentage: v.number(),
      explanation: v.optional(v.string()),
    }),
    health: v.object({
      percentage: v.number(),
      explanation: v.optional(v.string()),
    }),
  }),
  monthly: v.object({
    sunSign: v.string(),
    love: v.object({
      percentage: v.number(),
      explanation: v.optional(v.string()),
    }),
    career: v.object({
      percentage: v.number(),
      explanation: v.optional(v.string()),
    }),
    luck: v.object({
      percentage: v.number(),
      explanation: v.optional(v.string()),
    }),
    health: v.object({
      percentage: v.number(),
      explanation: v.optional(v.string()),
    }),
  }),
  createdAt: v.number(),
};

export const DreamAnalysisData = {
  userId: v.string(),
  dreamDescription: v.string(),
  symbols: v.array(
    v.object({
      symbol: v.string(),
      meanings: v.array(v.string()),
    })
  ),
  overallMessage: v.string(),
  createdAt: v.number(),
  date: v.string(),
};

export const PalmistryAnalysisData = {
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
  createdAt: v.number(),
  date: v.string(),
};

export default defineSchema({
  users: defineTable(User).index("byClerkId", ["clerkId"]),
  horoscopes: defineTable(HoroscopeData)
    .index("by_user_date", ["userId", "date"])
    .index("by_user", ["userId"]),
  dreams: defineTable(DreamAnalysisData)
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),
  palmistries: defineTable(PalmistryAnalysisData)
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),
});
