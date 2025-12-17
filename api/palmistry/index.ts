import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import * as FileSystem from "expo-file-system";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL!;
const client = new ConvexHttpClient(convexUrl);

export const analysePalm = async (photoUri: string, selectedLang: string) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(photoUri);
    if (!fileInfo.exists) {
      throw new Error("Photo file does not exist");
    }

    console.log("File size:", fileInfo.size);

    // Check file size (OpenAI has a 20MB limit)
    if (fileInfo.size && fileInfo.size > 20 * 1024 * 1024) {
      throw new Error("Image file too large (>20MB)");
    }

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(photoUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Validate base64
    if (!base64 || base64.length === 0) {
      throw new Error("Failed to convert image to base64");
    }

    console.log("Base64 length:", base64.length);
    console.log("🖐️ Analyzing palm (via Convex - Secure)");

    // Call the secure Convex action
    const result = await client.action(api.openai.analyzePalmistry, {
      base64Image: base64,
      selectedLang,
    });

    console.log("Parsed palm analysis:", result);
    return result;
  } catch (error) {
    console.error("Error analyzing palm:", error);

    return {
      status: 500,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export const validateImageForPalmAnalysis = async (
  photoUri: string
): Promise<{ valid: boolean; error?: string }> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(photoUri);

    if (!fileInfo.exists) {
      return { valid: false, error: "File does not exist" };
    }

    if (fileInfo.size && fileInfo.size > 20 * 1024 * 1024) {
      return { valid: false, error: "File too large (>20MB)" };
    }

    if (fileInfo.size && fileInfo.size < 1024) {
      return { valid: false, error: "File too small (likely corrupted)" };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: `Validation error: ${error}` };
  }
};

// // Enhanced test function to debug what AI sees
// export const testImageReadability = async (photoUri: string) => {
//   console.log("🖼️ Testing image readability...");

//   try {
//     const response = await openai.chat.completions.create({
//       model: "gpt-4o",
//       messages: [
//         {
//           role: "user",
//           content: [
//             {
//               type: "text",
//               text: "Describe what you see in this image in detail. Is it a hand? What features are visible? Can you see the palm? Any lines visible? What's the lighting and clarity like?",
//             },
//             {
//               type: "image_url",
//               image_url: {
//                 url: `data:image/jpeg;base64,${await FileSystem.readAsStringAsync(
//                   photoUri,
//                   {
//                     encoding: FileSystem.EncodingType.Base64,
//                   }
//                 )}`,
//                 detail: "high",
//               },
//             },
//           ],
//         },
//       ],
//       max_tokens: 300,
//     });

//     const description = response.choices[0].message.content;
//     console.log("👁️ Image description:", description);
//     return description;
//   } catch (error) {
//     console.error("❌ Image test failed:", error);
//     return null;
//   }
// };

// // New helper function: If AI still refuses, use two-step approach
// export const analysePalmFallback = async (photoUri: string) => {
//   try {
//     console.log("🔄 Trying fallback two-step analysis...");

//     const base64 = await FileSystem.readAsStringAsync(photoUri, {
//       encoding: FileSystem.EncodingType.Base64,
//     });

//     // Step 1: Get AI to describe what it sees
//     const descriptionResponse = await openai.chat.completions.create({
//       model: "gpt-4o",
//       messages: [
//         {
//           role: "user",
//           content: [
//             {
//               type: "text",
//               text: "Describe this hand in detail as JSON: {hand_shape: '', palm_description: '', finger_description: '', visible_lines: '', skin_texture: '', overall_impression: ''}",
//             },
//             {
//               type: "image_url",
//               image_url: {
//                 url: `data:image/jpeg;base64,${base64}`,
//                 detail: "high",
//               },
//             },
//           ],
//         },
//       ],
//       response_format: { type: "json_object" },
//     });

//     const description = JSON.parse(
//       descriptionResponse.choices[0].message.content || "{}"
//     );
//     console.log("📝 Hand description:", description);

//     // Step 2: Generate palm reading from description
//     const readingResponse = await openai.chat.completions.create({
//       model: "gpt-4o",
//       messages: [
//         {
//           role: "system",
//           content:
//             "You are a professional palm reader. Based on hand descriptions, provide palmistry interpretations.",
//         },
//         {
//           role: "user",
//           content: `Based on this hand description, provide a complete palm reading in JSON format:

// ${JSON.stringify(description, null, 2)}

// Return this exact structure:
// {
//   "status": 200,
//   "analysis": {
//     "summary": "personality overview",
//     "hand_type": "hand classification and overall description",
//     "life_line": "detailed life line analysis and interpretation",
//     "heart_line": "detailed heart line analysis and interpretation",
//     "fate_line": "detailed fate line analysis and interpretation"
//   }
// }`,
//         },
//       ],
//       response_format: { type: "json_object" },
//       temperature: 0.7,
//     });

//     const result = JSON.parse(
//       readingResponse.choices[0].message.content || "{}"
//     );
//     console.log("✅ Fallback analysis complete");

//     return result;
//   } catch (error) {
//     console.error("❌ Fallback analysis failed:", error);
//     throw error;
//   }
// };
