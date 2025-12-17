import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";

const zodiacProperties: Record<
  string,
  { element: string; polarity: string; modality: string }
> = {
  Aries: { element: "Fire", polarity: "Positive", modality: "Cardinal" },
  Taurus: { element: "Earth", polarity: "Negative", modality: "Fixed" },
  Gemini: { element: "Air", polarity: "Positive", modality: "Mutable" },
  Cancer: { element: "Water", polarity: "Negative", modality: "Cardinal" },
  Leo: { element: "Fire", polarity: "Positive", modality: "Fixed" },
  Virgo: { element: "Earth", polarity: "Negative", modality: "Mutable" },
  Libra: { element: "Air", polarity: "Positive", modality: "Cardinal" },
  Scorpio: { element: "Water", polarity: "Negative", modality: "Fixed" },
  Sagittarius: { element: "Fire", polarity: "Positive", modality: "Mutable" },
  Capricorn: { element: "Earth", polarity: "Negative", modality: "Cardinal" },
  Aquarius: { element: "Air", polarity: "Positive", modality: "Fixed" },
  Pisces: { element: "Water", polarity: "Negative", modality: "Mutable" },
};

function getSunSign(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21))
    return "Scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21))
    return "Sagittarius";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19))
    return "Capricorn";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18))
    return "Aquarius";
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return "Pisces";

  return "";
}

function getMoonSign(date: Date): string {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const index = dayOfYear % 12;
  const signs = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ];

  return signs[index];
}

function getAscendantFallback(date: Date): string {
  const signs: string[] = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ];
  const hour = date.getHours();
  const index = Math.floor(hour / 2) % 12;

  return signs[index];
}

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const getProfilePictureUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const registerFullUser = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    try {
      const isUserExist = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
        .unique();

      console.log("User exists?", !!isUserExist);

      let sunSign: string | undefined;
      let moonSign: string | undefined;
      let ascendant: string | undefined;
      let element: string | undefined;
      let polarity: string | undefined;
      let modality: string | undefined;

      // Birth date calculations
      if (args.birthDate) {
        const dateParts = args.birthDate.split(".");
        let birthDateObj: Date;

        if (dateParts.length === 3) {
          const isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
          const isoWithTime = args.birthTime
            ? `${isoDate}T${args.birthTime}`
            : isoDate;
          birthDateObj = new Date(isoWithTime);
        } else {
          birthDateObj = new Date(args.birthDate);
        }

        // Calculate Sun and Moon signs
        sunSign = getSunSign(birthDateObj);
        moonSign = getMoonSign(birthDateObj);

        // Calculate Ascendant - use provided ascendant or fallback
        if (args.ascendant) {
          ascendant = args.ascendant;
        } else {
          // Use fallback calculation if ascendant not provided
          ascendant = getAscendantFallback(birthDateObj);
        }

        // Get zodiac properties
        const zodiacInfo =
          zodiacProperties[sunSign as keyof typeof zodiacProperties];
        if (zodiacInfo) {
          element = zodiacInfo.element;
          polarity = zodiacInfo.polarity;
          modality = zodiacInfo.modality;
        }
      }

      // Get image URL if profilePictureId is provided
      let finalImageUrl = args.imageUrl;
      if (args.profilePictureId) {
        finalImageUrl =
          (await ctx.storage.getUrl(args.profilePictureId)) || undefined;
      }

      const userData = {
        clerkId: args.clerkId,
        email: args.email,
        gender: args.gender,
        imageUrl: finalImageUrl,
        firstName: args.firstName,
        lastName: args.lastName,
        birthDate: args.birthDate,
        birthTime: args.birthTime,
        city: args.city,
        userType: args.userType,
        sunSign,
        moonSign,
        ascendant,
        element,
        polarity,
        modality,
        profilePictureId: args.profilePictureId,
      };

      let userRecord;

      if (isUserExist) {
        console.log("Updating existing user:", isUserExist._id);

        // Delete old profile picture if a new one is being uploaded
        if (
          args.profilePictureId &&
          isUserExist.profilePictureId &&
          args.profilePictureId !== isUserExist.profilePictureId
        ) {
          try {
            await ctx.storage.delete(isUserExist.profilePictureId);
          } catch (error) {
            console.log("Could not delete old profile picture:", error);
          }
        }

        userRecord = await ctx.db.patch(isUserExist._id, userData);
      } else {
        console.log("Creating new user");
        userRecord = await ctx.db.insert("users", userData);
      }

      return userRecord;
    } catch (error: any) {
      console.error("HATA: registerFullUser işleminde bir problem oluştu");
      console.error(error.message);
      throw new Error("Kullanıcı kaydı sırasında bir hata oluştu.");
    }
  },
});
// Update profile picture

// Get user profile with picture URL
export const getUserProfile = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return null;
    }

    // If profilePictureId exists but imageUrl doesn't, generate it
    let profilePictureUrl = user.imageUrl;
    if (user.profilePictureId && !profilePictureUrl) {
      profilePictureUrl =
        (await ctx.storage.getUrl(user.profilePictureId)) || undefined;
    }

    return {
      ...user,
      profilePictureUrl,
    };
  },
});

export const createUserInDB = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    gender: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    birthDate: v.optional(v.string()),
    city: v.optional(v.string()),
    sunSign: v.optional(v.string()),
    moonSign: v.optional(v.string()),
    ascendant: v.optional(v.string()),
    element: v.optional(v.string()),
    polarity: v.optional(v.string()),
    modality: v.optional(v.string()),
    userType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalizedArgs = Object.fromEntries(
      Object.entries(args).map(([key, value]) => [key, value ?? null])
    ) as typeof args;
    const userId = await ctx.db.insert("users", normalizedArgs);
    console.log(normalizedArgs);
    return userId;
  },
});

export const getUserWithClerkID = query({
  args: {
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userData = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
      .unique();

    if (userData) {
      const mappedUserData = {
        clerkId: userData.clerkId,
        email: userData.email,
        gender: userData.gender ?? null,
        imageUrl: userData.imageUrl ?? null,
        firstName: userData.firstName ?? null,
        lastName: userData.lastName ?? null,
        birthDate: userData.birthDate ?? null,
        city: userData.city ?? null,
        sunSign: userData.sunSign ?? null,
        moonSign: userData.moonSign ?? null,
        ascendant: userData.ascendant ?? null,
        element: userData.element ?? null,
        polarity: userData.polarity ?? null,
        modality: userData.modality ?? null,
      };

      if (!userData?.imageUrl || userData.imageUrl.startsWith("http")) {
        return userData;
      }

      const url = await ctx.storage.getUrl(userData.imageUrl as Id<"_storage">);
      return {
        ...mappedUserData,
        imageUrl: url,
      };
    }
  },
});

export const getTodaysHoroscope = query({
  args: {
    userId: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const horoscope = await ctx.db
      .query("horoscopes")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    return horoscope;
  },
});

export const saveHoroscope = mutation({
  args: {
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
    monthly: v.object({
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
  },
  handler: async (ctx, args) => {
    const { userId, date, ...horoscopeData } = args;

    const existing = await ctx.db
      .query("horoscopes")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
      .first();

    if (existing) {
      return await ctx.db.patch(existing._id, {
        ...horoscopeData,
        createdAt: Date.now(),
      });
    } else {
      return await ctx.db.insert("horoscopes", {
        userId,
        date,
        ...horoscopeData,
        createdAt: Date.now(),
      });
    }
  },
});

// Update profile picture
export const updateProfilePicture = mutation({
  args: {
    clerkId: v.string(),
    profilePictureId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Delete old profile picture if exists
    if (user.profilePictureId) {
      try {
        await ctx.storage.delete(user.profilePictureId);
        console.log("Old profile picture deleted");
      } catch (error) {
        console.log("Could not delete old profile picture:", error);
      }
    }

    // Get new image URL
    const imageUrl = await ctx.storage.getUrl(args.profilePictureId);

    // Update with new profile picture
    await ctx.db.patch(user._id, {
      profilePictureId: args.profilePictureId,
      imageUrl: imageUrl || undefined,
    });

    console.log("Profile picture updated successfully");
    return { success: true, imageUrl };
  },
});

export const deleteUser = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Get the user document
      const user = await ctx.db
        .query("users")
        .withIndex("byClerkId", (q) => q.eq("clerkId", args.clerkId))
        .first();

      if (!user) {
        throw new Error("User not found");
      }

      // Delete user's horoscopes
      const horoscopes = await ctx.db
        .query("horoscopes")
        .withIndex("by_user_date", (q) => q.eq("userId", args.clerkId))
        .collect();

      for (const horoscope of horoscopes) {
        await ctx.db.delete(horoscope._id);
      }

      // Delete profile picture from storage if exists
      if (user.profilePictureId) {
        try {
          await ctx.storage.delete(user.profilePictureId);
          console.log("Profile picture deleted from storage");
        } catch (error) {
          console.log("Could not delete profile picture:", error);
        }
      }

      // Add any other related data deletions here
      // For example: if you have messages, conversations, posts, etc.
      // const messages = await ctx.db
      //   .query("messages")
      //   .withIndex("by_user", (q) => q.eq("userId", user._id))
      //   .collect();
      // for (const message of messages) {
      //   await ctx.db.delete(message._id);
      // }

      // Finally, delete the user
      await ctx.db.delete(user._id);

      console.log("User deleted successfully:", args.clerkId);
      return { success: true };
    } catch (error: any) {
      console.error("Error deleting user:", error.message);
      throw new Error("Failed to delete user from database");
    }
  },
});

// Update user subscription status
export const updateSubscription = mutation({
  args: {
    clerkId: v.string(),
    userType: v.string(), // "normal" or "premium"
    subscriptionStatus: v.optional(v.string()),
    revenueCatUserId: v.optional(v.string()),
    subscriptionEndDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      userType: args.userType,
      subscriptionStatus: args.subscriptionStatus,
      revenueCatUserId: args.revenueCatUserId,
      subscriptionEndDate: args.subscriptionEndDate,
      subscriptionStartDate:
        args.userType === "premium" ? Date.now() : user.subscriptionStartDate,
      lastSubscriptionCheck: Date.now(),
    });

    return { success: true };
  },
});

// Get user subscription info
export const getSubscription = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) return null;

    return {
      userType: user.userType || "normal",
      subscriptionStatus: user.subscriptionStatus,
      subscriptionEndDate: user.subscriptionEndDate,
    };
  },
});

// Check if subscription is still valid
export const checkSubscriptionValidity = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) return { isValid: false };

    const now = Date.now();
    const isExpired =
      user.subscriptionEndDate && user.subscriptionEndDate < now;

    if (isExpired && user.userType === "premium") {
      // Downgrade to normal
      await ctx.db.patch(user._id, {
        userType: "normal",
        subscriptionStatus: "expired",
      });
      return { isValid: false, wasDowngraded: true };
    }

    return {
      isValid: user.userType === "premium" && !isExpired,
      subscriptionEndDate: user.subscriptionEndDate,
    };
  },
});
