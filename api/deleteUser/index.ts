import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL!;
const client = new ConvexHttpClient(convexUrl);

interface DeleteClerkUserResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const deleteUserFromClerk = async (
  userId: string
): Promise<DeleteClerkUserResponse> => {
  try {
    console.log("🗑️ Deleting user from Clerk (via Convex - Secure)");

    const result = await client.action(api.openai.deleteClerkUser, {
      userId,
    });

    if (result.success) {
      console.log("User deleted from Clerk successfully:", result);
    } else {
      console.error("Failed to delete user from Clerk:", result);
    }

    return result;
  } catch (error) {
    console.error("Error deleting user from Clerk:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};
