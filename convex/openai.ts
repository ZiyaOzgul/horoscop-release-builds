import { v } from "convex/values";
import OpenAI from "openai";
import { action } from "./_generated/server";

export const generateHoroscope = action({
  args: {
    horoscopeDetails: v.string(),
    selectedLang: v.string(),
    period: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly")
    ),
    isPremium: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Get the API key from Convex environment variables (server-side only!)
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured in Convex dashboard");
    }

    const openai = new OpenAI({ apiKey });

    try {
      console.log(`🌐 Fetching ${args.period} horoscope (Server-side)`);

      // For free users on weekly/monthly, only return sunSign
      const isFreeUser = !args.isPremium && args.period !== "daily";

      const systemContent = isFreeUser
        ? `You are an expert astrologer. Create a ${args.period} horoscope in ${args.selectedLang}.

Return ONLY valid JSON without markdown:
{
  "status": 200,
  "horoscope": {
    "sunSign": "detailed explanation (minimum 5-6 sentences) with planetary influences and actionable advice",
    "love": {"percentage": 0-100 },
    "career": {"percentage": 0-100 },
    "luck": {"percentage": 0-100 },
    "health": {"percentage": 0-100}
  }
}

Be specific and insightful based on: ${args.horoscopeDetails}`
        : `You are an expert astrologer. Create a ${args.period} horoscope in ${args.selectedLang}.

Return ONLY valid JSON without markdown:
{
  "status": 200,
  "horoscope": {
    "sunSign": "detailed explanation (minimum 5-6 sentences) with planetary influences and actionable advice",
    "love": {"percentage": 0-100, "explanation": "detailed explanation (minimum 4-5 sentences)"},
    "career": {"percentage": 0-100, "explanation": "detailed explanation (minimum 4-5 sentences)"},
    "luck": {"percentage": 0-100, "explanation": "detailed explanation (minimum 4-5 sentences)"},
    "health": {"percentage": 0-100, "explanation": "detailed explanation (minimum 4-5 sentences)"}
  }
}

Be specific and insightful based on: ${args.horoscopeDetails}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemContent,
          },
          {
            role: "user",
            content: `Generate ${args.period} horoscope`,
          },
        ],
        temperature: 0.7,
        max_tokens: isFreeUser ? 800 : 1500,
        top_p: 0.9,
      });

      const messageContent = response.choices[0].message.content;
      if (!messageContent) {
        throw new Error("Message content is null");
      }

      const cleanedContent = messageContent
        .replace(/```json\n?|\n?```/g, "")
        .trim();
      const message = JSON.parse(cleanedContent);

      return {
        status: message.status,
        horoscope: message.horoscope,
      };
    } catch (error) {
      console.error(`Error on ${args.period} horoscope:`, error);
      throw error;
    }
  },
});

export const interpretDream = action({
  args: {
    dreamText: v.string(),
    selectedLang: v.string(),
    gender: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured in Convex dashboard");
    }

    const openai = new OpenAI({ apiKey });

    try {
      const genderContext = args.gender
        ? ` The dreamer is ${args.gender}. Consider gender-related cultural and personal contexts when interpreting symbols, but avoid stereotypes. Focus on the dreamer's personal experience and emotions.`
        : "";

      const systemContent = `You are an expert dream interpreter and psychologist specializing in dream analysis. Provide detailed, insightful, and culturally-aware dream interpretations based on established dream psychology principles.

Analyze the dream carefully, identifying key symbols and their multiple layers of meaning. Consider both universal and personal contexts.${genderContext}

Return ONLY valid JSON without markdown:
{
  "status": 200,
  "interpretation": {
    "symbols": [
      {
        "symbol": "symbol name (e.g., water, snake, flying)",
        "meanings": [
          "first meaning explanation (minimum 2-3 sentences)",
          "second meaning explanation (minimum 2-3 sentences)",
          "third meaning explanation (minimum 2-3 sentences)"
        ]
      }
    ],
    "overall_message": "Comprehensive interpretation (minimum 4-5 sentences) connecting all symbols and providing deeper insight into the dream's message for the dreamer's life, emotions, and subconscious thoughts."
  }
}

Requirements:
- Identify 3-5 key symbols from the dream
- Provide 2-3 different meanings for each symbol (each meaning should be 2-3 sentences)
- Write overall_message that synthesizes all symbols into a cohesive interpretation
- Be insightful, empathetic, and provide actionable insights
- Consider cultural and personal contexts, including gender when relevant, but avoid stereotypes
- Use only ${args.selectedLang} language for all content`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemContent,
          },
          {
            role: "user",
            content: `Interpret this dream in detail: ${args.dreamText}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 0.9,
      });

      const messageContent = response.choices[0].message.content;
      if (!messageContent) {
        throw new Error("Message content is null");
      }

      const cleanedContent = messageContent
        .replace(/```json\n?|\n?```/g, "")
        .trim();
      const message = JSON.parse(cleanedContent);

      return {
        status: message.status,
        interpretation: message.interpretation,
      };
    } catch (error) {
      console.error("Error interpreting dream:", error);
      throw error;
    }
  },
});

export const analyzeLoveMatch = action({
  args: {
    zodiacPair: v.string(),
    selectedLang: v.string(),
    firstPersonGender: v.optional(v.string()),
    secondPersonGender: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured in Convex dashboard");
    }

    const openai = new OpenAI({ apiKey });

    try {
      let genderContext = "";
      if (args.firstPersonGender && args.secondPersonGender) {
        genderContext = ` The first person is ${args.firstPersonGender} and the second person is ${args.secondPersonGender}. Consider gender dynamics and relationship patterns when analyzing compatibility, but focus on zodiac traits and personal compatibility rather than stereotypes.`;
      } else if (args.firstPersonGender) {
        genderContext = ` The first person is ${args.firstPersonGender}. Consider this context when analyzing compatibility, but prioritize zodiac traits and elemental compatibility.`;
      }

      const systemContent = `You are an expert astrologer specializing in zodiac compatibility. Analyze compatibility with detailed explanations (3-4 sentences minimum per category). Consider zodiac traits, elemental compatibility, planetary influences, and relationship dynamics.${genderContext} Return only valid JSON, no markdown or extra text.`;

      const userContent = `Analyze ${args.zodiacPair} compatibility in ${args.selectedLang}. Provide percentage (0-100) and detailed explanation (minimum 3-4 sentences) for Love, Business, Sex, and Friendship. Consider elemental traits, strengths, challenges, and relationship dynamics.

JSON format:
{
  "status": 200,
  "match": {
    "percentage": "75",
    "categories": {
      "love": {"percentage": 85, "explanation": "detailed explanation here..."},
      "business": {"percentage": 70, "explanation": "detailed explanation here..."},
      "sex": {"percentage": 90, "explanation": "detailed explanation here..."},
      "friendship": {"percentage": 80, "explanation": "detailed explanation here..."}
    }
  }
}

Return ONLY the JSON object.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemContent,
          },
          {
            role: "user",
            content: userContent,
          },
        ],
        temperature: 0.8,
        max_tokens: 3000,
        top_p: 0.95,
      });

      const messageContent = response.choices[0].message.content;
      if (!messageContent) {
        throw new Error("Message content is null");
      }

      const cleanedContent = messageContent
        .replace(/```json\n?|\n?```/g, "")
        .trim();
      const message = JSON.parse(cleanedContent);

      if (!message.match || !message.match.categories) {
        throw new Error("Invalid response structure from GPT");
      }

      const defaultCategory = {
        percentage: 50,
        explanation: "Analysis unavailable for this category.",
      };

      const categories = {
        love: message.match.categories.love || defaultCategory,
        business: message.match.categories.business || defaultCategory,
        sex: message.match.categories.sex || defaultCategory,
        friendship: message.match.categories.friendship || defaultCategory,
      };

      return {
        status: message.status || 200,
        loveMatch: {
          percentage: message.match.percentage || "50%",
          categories: categories,
        },
      };
    } catch (error) {
      console.error("Error analyzing love match:", error);
      throw error;
    }
  },
});

export const analyzePalmistry = action({
  args: {
    base64Image: v.string(),
    selectedLang: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured in Convex dashboard");
    }

    const openai = new OpenAI({ apiKey });

    const systemPrompt = `
You are an expert palm reader who analyzes any hand photo, regardless of quality.
RULES:
1. Never refuse analysis unless the image is clearly not a hand.
2. Always give a full reading from visible features.
3. If lines are unclear, use hand shape, finger proportions, and overall look.
4. Faint lines still have meaning—interpret them as subtle traits.
OBSERVABLE FEATURES:
- Hand shape: square/rectangular, wide/narrow
- Finger length vs. palm: short/balanced/long
- Hand type: Earth (square palm, short fingers), Air (square, long fingers), Fire (long palm, short fingers), Water (long palm, long fingers)
LINES:
- Life line: energy/vitality (faint = adaptable, strong = robust)
- Heart line: emotions (subtle = private, clear = expressive)
- Fate line: career/direction (absent = independent, faint = flexible, clear = focused)
ALWAYS return:
{
  "status": 200,
  "analysis": {
    "details": "detailed  (minimum 3-4 sentences) palm reading.",
    "result": " detailed  (minimum 3-4 sentences) Future insights and tendencies.",
    "summary": "detailed  (minimum 3-4 sentences) personality overview.",
    "hand_type": "detailed  (minimum 2-4 sentences) Overall hand type and shape.",
    "life_line": "detailed  (minimum 2-4 sentences) Observation + meaning of vitality and resilience.",
    "heart_line": "detailed  (minimum 2-4 sentences) Observation + meaning of emotions and relationships.",
    "fate_line": "detailed  (minimum 2-4 sentences) Observation + meaning of direction and ambition."
  }
}
If the image is not a hand at all, return only:{ "status": 202 } give the all results language of only  ${args.selectedLang}
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this hand photo for palm reading. Work with whatever details are visible - hand shape, finger proportions, any visible lines or features. Even if some lines appear faint or subtle, this is meaningful in palmistry. Provide a complete professional reading based on what you observe. Remember: many people naturally have faint lines, and interpreting these is part of your expertise. Return ONLY the JSON format specified.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${args.base64Image}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 2500,
        temperature: 0.7,
      });

      const messageContent = response.choices[0].message.content;
      console.log("Raw AI response:", messageContent);

      if (!messageContent) {
        throw new Error("AI response is empty");
      }

      let cleanedContent = messageContent.trim();

      // Remove markdown code blocks if present
      if (cleanedContent.startsWith("```json")) {
        cleanedContent = cleanedContent
          .replace(/```json\n?/, "")
          .replace(/\n?```$/, "");
      } else if (cleanedContent.startsWith("```")) {
        cleanedContent = cleanedContent
          .replace(/```\n?/, "")
          .replace(/\n?```$/, "");
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        // Try to extract JSON from the content
        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error(`Failed to parse AI response as JSON`);
        }
      }

      // Validate response structure
      if (!parsedResponse.status) {
        throw new Error("Invalid response format: missing status");
      }

      if (parsedResponse.status === 200) {
        if (!parsedResponse.analysis) {
          throw new Error(
            "Invalid response format: missing analysis for successful status"
          );
        }

        // Ensure all required fields exist
        const analysis = parsedResponse.analysis;
        if (
          !analysis.summary ||
          !analysis.hand_type ||
          !analysis.life_line ||
          !analysis.heart_line ||
          !analysis.fate_line
        ) {
          throw new Error("Invalid response: missing required analysis fields");
        }
      }

      return {
        status: parsedResponse.status,
        analysis: parsedResponse.analysis,
        message: parsedResponse.message,
      };
    } catch (error) {
      console.error("Error analyzing palmistry:", error);
      throw error;
    }
  },
});

export const calculateAscendant = action({
  args: {
    birthDate: v.string(),
    birthTime: v.string(),
    city: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured in Convex dashboard");
    }

    const openai = new OpenAI({ apiKey });

    try {
      // Convert DD.MM.YYYY to YYYY-MM-DD for better GPT understanding
      const dateParts = args.birthDate.split(".");
      const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
      console.log(
        "🌟 Calculating ascendant (Server-side):",
        args.birthDate,
        args.birthTime,
        args.city
      );

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert astrologer specializing in ascendant (rising sign) calculations. Calculate the ascendant sign based on the provided birth data. Return ONLY a JSON object with no markdown formatting or json prefix. The JSON must have this exact structure: {"status": 200, "ascendant": {"sign": "sign name"}}. The sign name must be one of: Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces. Provide the result only english language.`,
          },
          {
            role: "user",
            content: `Calculate the ascendant (rising sign) for someone born on ${formattedDate} at ${args.birthTime} in ${args.city}. Return only the ascendant sign name.`,
          },
        ],
        temperature: 0.5,
        max_tokens: 256,
        top_p: 1,
      });

      const messageContent = response.choices[0].message.content;
      if (!messageContent) {
        throw new Error("Message content is null");
      }

      // Remove potential markdown formatting
      const cleanContent = messageContent
        .replace(/```json\n?|\n?```/g, "")
        .trim();
      const message = JSON.parse(cleanContent);

      console.log("Ascendant calculation complete", message);

      return {
        status: message.status,
        ascendant: message.ascendant.sign,
      };
    } catch (error) {
      console.error("Error calculating ascendant with GPT:", error);
      throw error;
    }
  },
});

export const deleteClerkUser = action({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      throw new Error("CLERK_SECRET_KEY not configured in Convex dashboard");
    }

    try {
      console.log("🗑️ Deleting user from Clerk (Server-side):", args.userId);

      const deleteReq = await fetch(
        `https://api.clerk.com/v1/users/${args.userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${clerkSecretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await deleteReq.json();

      if (deleteReq.ok) {
        console.log("User deleted from Clerk successfully:", result);
        return {
          success: true,
          data: result,
        };
      } else {
        console.error("Failed to delete user from Clerk:", result);
        return {
          success: false,
          error: result.message || "Failed to delete user from Clerk",
        };
      }
    } catch (error) {
      console.error("Error deleting user from Clerk:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

export const interpretTarot = action({
  args: {
    intent: v.string(),
    spread: v.string(),
    domain: v.string(),
    cards: v.array(
      v.object({
        position: v.number(),
        cardName: v.string(),
        direction: v.union(v.literal("upright"), v.literal("reversed")),
        positionMeaning: v.string(),
      })
    ),
    selectedLang: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured in Convex dashboard");
    }

    const openai = new OpenAI({ apiKey });

    try {
      // Language-specific prompts
      const getLanguagePrompts = (lang: string) => {
        // Normalize language code (ja/jp -> jp)
        const normalizedLang = lang === "ja" ? "jp" : lang;
        
        const langMap: { [key: string]: { system: string; user: (intent: string, domain: string, spread: string, cards: string) => string; cardDesc: (card: any) => string } } = {
          tr: {
            system: `Sen derin tarot kartı anlamları, sembolizmi ve yorumlama bilgisine sahip uzman bir tarot okuyucususun. Kartların anlamlarını soran kişinin sorusu ve yaşam durumuyla bağlantılandıran detaylı, içgörülü tarot okumaları sağla.

Dikkate al:
- Her kartın geleneksel anlamı (hem düz hem ters)
- Açılımdaki pozisyonun önemi
- Kartların birbirleriyle nasıl etkileşime girdiği
- Soran kişinin niyeti ve sorgu alanı
- Pratik rehberlik ve uygulanabilir içgörüler

SADECE geçerli JSON döndür, markdown kullanma:
{
  "status": 200,
  "reading": {
    "overall_summary": "Tüm kartları sentezleyen ve soran kişinin niyetini ele alan kapsamlı yorum (en az 5-6 cümle)",
    "cards": [
      {
        "position": 1,
        "cardName": "kart adı",
        "direction": "düz veya ters",
        "positionMeaning": "pozisyon anlamı",
        "interpretation": "Bu kartın anlamını ve pozisyonun önemini göz önünde bulundurarak bu pozisyondaki bu özel kart için detaylı yorum (en az 3-4 cümle)"
      }
    ],
    "guidance": "Okumaya dayalı pratik tavsiye ve sonraki adımlar (en az 3-4 cümle)"
  }
}

Tüm içerik için sadece Türkçe kullan.

ÖNEMLİ - Kart İsimleri Formatı:
Minor Arcana kartları için Türkçe formatı şu şekilde olmalı:
- "Kılıçların Yedisi" (Seven of Swords için)
- "Kılıçların Üçü" (Three of Swords için)
- "Kupanın Beşi" (Five of Cups için)
- "Asanın Altısı" (Six of Wands için)
- "Altının Onu" (Ten of Pentacles için)

YANLIŞ formatlar: "yedili devir", "üçüncü kılıç", "yedili kılıç", "yedili kılıçlar"
DOĞRU format: "Kılıçların Yedisi", "Kılıçların Üçü", "Kupanın Beşi"

Kart isimlerini yorumlarken bu formatı kullan.`,
            user: (intent: string, domain: string, spread: string, cards: string) => `Bu tarot okumasını yorumla:

Niyet/Soru: ${intent}
Alan: ${domain}
Açılım Türü: ${spread}

Kartlar:
${cards}

Şunları içeren detaylı bir yorum sağla:
1. Soran kişinin niyetini ve sorusunu ele al
2. Her kartı pozisyonunda yorumla
3. Kartların birbirleriyle nasıl ilişkili olduğunu göster
4. ${domain} alanı için pratik rehberlik sağla
5. Uygulanabilir olduğunda hem düz hem ters anlamları dikkate al

ÖNEMLİ: Kart isimlerini yorumlarken Türkçe formatını kullan:
- Minor Arcana kartları için: "Kılıçların Yedisi", "Kupanın Üçü", "Asanın Beşi", "Altının Onu" formatını kullan
- "yedili devir", "üçüncü kılıç", "yedili kılıç" gibi yanlış formatlar kullanma
- Doğru format: "Kılıçların Yedisi", "Kılıçların Üçü", "Kupanın Beşi" şeklinde olmalı

SADECE JSON nesnesini döndür.`,
            cardDesc: (card: any) => `Pozisyon ${card.position} (${card.positionMeaning}): ${card.cardName} - ${card.direction === "upright" ? "Düz" : "Ters"}`
          },
          en: {
            system: `You are an expert tarot reader with deep knowledge of tarot card meanings, symbolism, and interpretation. Provide detailed, insightful tarot readings that connect the cards' meanings to the querent's question and life situation.

Consider:
- Each card's traditional meaning (both upright and reversed)
- The position's significance in the spread
- How cards interact with each other
- The querent's intent and domain of inquiry
- Practical guidance and actionable insights

Return ONLY valid JSON without markdown:
{
  "status": 200,
  "reading": {
    "overall_summary": "Comprehensive interpretation (minimum 5-6 sentences) that synthesizes all cards and addresses the querent's intent",
    "cards": [
      {
        "position": 1,
        "cardName": "card name",
        "direction": "upright or reversed",
        "positionMeaning": "position meaning",
        "interpretation": "Detailed interpretation for this specific card in this position (minimum 3-4 sentences), considering both the card's meaning and the position's significance"
      }
    ],
    "guidance": "Practical advice and next steps (minimum 3-4 sentences) based on the reading"
  }
}

Use only English for all content.`,
            user: (intent: string, domain: string, spread: string, cards: string) => `Interpret this tarot reading:

Intent/Question: ${intent}
Domain: ${domain}
Spread Type: ${spread}

Cards:
${cards}

Provide a detailed interpretation that:
1. Addresses the querent's intent and question
2. Interprets each card in its position
3. Shows how cards relate to each other
4. Provides practical guidance for the ${domain} domain
5. Considers both upright and reversed meanings where applicable

Return ONLY the JSON object.`,
            cardDesc: (card: any) => `Position ${card.position} (${card.positionMeaning}): ${card.cardName} - ${card.direction === "upright" ? "Upright" : "Reversed"}`
          },
          jp: {
            system: `あなたはタロットカードの意味、象徴性、解釈について深い知識を持つ専門のタロットリーダーです。カードの意味を質問者の質問と人生の状況に結びつける詳細で洞察に富んだタロットリーディングを提供してください。

考慮事項：
- 各カードの伝統的な意味（正位置と逆位置の両方）
- スプレッド内の位置の重要性
- カードが互いにどのように相互作用するか
- 質問者の意図と質問の領域
- 実践的なガイダンスと実行可能な洞察

マークダウンなしで有効なJSONのみを返してください：
{
  "status": 200,
  "reading": {
    "overall_summary": "すべてのカードを統合し、質問者の意図に対処する包括的な解釈（最低5-6文）",
    "cards": [
      {
        "position": 1,
        "cardName": "カード名",
        "direction": "正位置または逆位置",
        "positionMeaning": "位置の意味",
        "interpretation": "カードの意味と位置の重要性の両方を考慮して、この位置にあるこの特定のカードの詳細な解釈（最低3-4文）"
      }
    ],
    "guidance": "リーディングに基づく実践的なアドバイスと次のステップ（最低3-4文）"
  }
}

すべてのコンテンツに日本語のみを使用してください。`,
            user: (intent: string, domain: string, spread: string, cards: string) => `このタロットリーディングを解釈してください：

意図/質問：${intent}
領域：${domain}
スプレッドタイプ：${spread}

カード：
${cards}

以下の詳細な解釈を提供してください：
1. 質問者の意図と質問に対処する
2. 各カードをその位置で解釈する
3. カードが互いにどのように関連しているかを示す
4. ${domain}領域の実践的なガイダンスを提供する
5. 該当する場合は正位置と逆位置の両方の意味を考慮する

JSONオブジェクトのみを返してください。`,
            cardDesc: (card: any) => `位置${card.position}（${card.positionMeaning}）：${card.cardName} - ${card.direction === "upright" ? "正位置" : "逆位置"}`
          },
          ru: {
            system: `Вы эксперт-таролог с глубокими знаниями значений карт Таро, символизма и интерпретации. Предоставляйте подробные, содержательные гадания на Таро, которые связывают значения карт с вопросом и жизненной ситуацией вопрошающего.

Учитывайте:
- Традиционное значение каждой карты (как прямой, так и перевернутой)
- Значение позиции в раскладе
- Как карты взаимодействуют друг с другом
- Намерение вопрошающего и область запроса
- Практические советы и действенные рекомендации

Возвращайте ТОЛЬКО валидный JSON без markdown:
{
  "status": 200,
  "reading": {
    "overall_summary": "Комплексная интерпретация (минимум 5-6 предложений), которая синтезирует все карты и обращается к намерению вопрошающего",
    "cards": [
      {
        "position": 1,
        "cardName": "название карты",
        "direction": "прямая или перевернутая",
        "positionMeaning": "значение позиции",
        "interpretation": "Подробная интерпретация для этой конкретной карты в этой позиции (минимум 3-4 предложения), учитывая как значение карты, так и важность позиции"
      }
    ],
    "guidance": "Практические советы и следующие шаги (минимум 3-4 предложения) на основе гадания"
  }
}

Используйте только русский язык для всего контента.`,
            user: (intent: string, domain: string, spread: string, cards: string) => `Интерпретируйте это гадание на Таро:

Намерение/Вопрос: ${intent}
Область: ${domain}
Тип расклада: ${spread}

Карты:
${cards}

Предоставьте подробную интерпретацию, которая:
1. Обращается к намерению и вопросу вопрошающего
2. Интерпретирует каждую карту в её позиции
3. Показывает, как карты связаны друг с другом
4. Предоставляет практические советы для области ${domain}
5. Учитывает как прямые, так и перевернутые значения, где применимо

Возвращайте ТОЛЬКО JSON объект.`,
            cardDesc: (card: any) => `Позиция ${card.position} (${card.positionMeaning}): ${card.cardName} - ${card.direction === "upright" ? "Прямая" : "Перевернутая"}`
          },
          sp: {
            system: `Eres un lector de tarot experto con un profundo conocimiento de los significados de las cartas del tarot, el simbolismo y la interpretación. Proporciona lecturas de tarot detalladas e intuitivas que conecten los significados de las cartas con la pregunta y la situación de vida del consultante.

Considera:
- El significado tradicional de cada carta (tanto derecha como invertida)
- La importancia de la posición en la tirada
- Cómo las cartas interactúan entre sí
- La intención del consultante y el dominio de la consulta
- Orientación práctica e ideas accionables

Devuelve SOLO JSON válido sin markdown:
{
  "status": 200,
  "reading": {
    "overall_summary": "Interpretación integral (mínimo 5-6 oraciones) que sintetiza todas las cartas y aborda la intención del consultante",
    "cards": [
      {
        "position": 1,
        "cardName": "nombre de la carta",
        "direction": "derecha o invertida",
        "positionMeaning": "significado de la posición",
        "interpretation": "Interpretación detallada para esta carta específica en esta posición (mínimo 3-4 oraciones), considerando tanto el significado de la carta como la importancia de la posición"
      }
    ],
    "guidance": "Consejos prácticos y próximos pasos (mínimo 3-4 oraciones) basados en la lectura"
  }
}

Usa solo español para todo el contenido.`,
            user: (intent: string, domain: string, spread: string, cards: string) => `Interpreta esta lectura de tarot:

Intención/Pregunta: ${intent}
Dominio: ${domain}
Tipo de Tirada: ${spread}

Cartas:
${cards}

Proporciona una interpretación detallada que:
1. Aborde la intención y pregunta del consultante
2. Interprete cada carta en su posición
3. Muestre cómo las cartas se relacionan entre sí
4. Proporcione orientación práctica para el dominio ${domain}
5. Considere tanto los significados derechos como invertidos cuando sea aplicable

Devuelve SOLO el objeto JSON.`,
            cardDesc: (card: any) => `Posición ${card.position} (${card.positionMeaning}): ${card.cardName} - ${card.direction === "upright" ? "Derecha" : "Invertida"}`
          }
        };

        // Default to English if language not found
        return langMap[normalizedLang] || langMap.en;
      };

      // Get language-specific prompts
      const prompts = getLanguagePrompts(args.selectedLang);

      // Build cards description using language-specific format
      const cardsDescription = args.cards
        .map((card) => prompts.cardDesc(card))
        .join("\n");

      const systemContent = prompts.system;
      const userContent = prompts.user(args.intent, args.domain, args.spread, cardsDescription);

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemContent,
          },
          {
            role: "user",
            content: userContent,
          },
        ],
        temperature: 0.8,
        max_tokens: 3000,
        top_p: 0.95,
        response_format: { type: "json_object" },
      });

      const messageContent = response.choices[0].message.content;
      if (!messageContent) {
        throw new Error("Message content is null");
      }

      // Clean the content more thoroughly
      let cleanedContent = messageContent
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .replace(/^json\s*/i, "")
        .trim();

      // Try to extract JSON if it's wrapped in other text
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedContent = jsonMatch[0];
      }

      // More aggressive JSON cleaning function
      const fixJSON = (content: string): string => {
        // Remove trailing commas before closing braces/brackets (multiple passes)
        let fixed = content;
        for (let i = 0; i < 5; i++) {
          fixed = fixed.replace(/,(\s*[}\]])/g, "$1");
        }
        
        // Fix unescaped newlines and carriage returns in string values
        // Process string values more carefully to avoid breaking valid JSON
        let result = "";
        let inString = false;
        let escapeNext = false;
        
        for (let i = 0; i < fixed.length; i++) {
          const char = fixed[i];
          
          if (escapeNext) {
            result += char;
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            result += char;
            escapeNext = true;
            continue;
          }
          
          if (char === '"') {
            inString = !inString;
            result += char;
            continue;
          }
          
          if (inString) {
            // Inside a string, escape newlines, tabs, and carriage returns
            if (char === '\n') {
              result += '\\n';
            } else if (char === '\r') {
              result += '\\r';
            } else if (char === '\t') {
              result += '\\t';
            } else if (char === '"' && !escapeNext) {
              result += '\\"';
            } else {
              result += char;
            }
          } else {
            result += char;
          }
        }
        
        fixed = result;
        
        // Remove any control characters that might break JSON (outside strings)
        // This is a simpler approach - just remove problematic control chars
        fixed = fixed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
        
        return fixed;
      };

      // Remove any trailing commas before closing braces/brackets
      cleanedContent = cleanedContent.replace(/,(\s*[}\]])/g, "$1");

      let message;
      try {
        message = JSON.parse(cleanedContent);
      } catch (parseError: any) {
        console.error("JSON Parse Error:", parseError);
        console.error("Parse error position:", parseError.message);
        console.error("Cleaned content length:", cleanedContent.length);
        console.error("Cleaned content (first 500 chars):", cleanedContent.substring(0, 500));
        
        // Try to fix common JSON issues
        try {
          // Apply aggressive JSON fixing
          cleanedContent = fixJSON(cleanedContent);
          
          // Try parsing again
          message = JSON.parse(cleanedContent);
          console.log("✅ Successfully parsed after fixing JSON issues");
        } catch (secondError: any) {
          console.error("Second parse attempt failed:", secondError);
          
          // Try one more time with even more aggressive fixes
          try {
            // Extract just the JSON object more carefully
            const deepJsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
            if (deepJsonMatch) {
              let deepFixed = fixJSON(deepJsonMatch[0]);
              // Remove any remaining problematic characters
              deepFixed = deepFixed
                .replace(/,\s*}/g, "}")
                .replace(/,\s*]/g, "]")
                .replace(/([^\\])\n/g, "$1\\n")
                .replace(/([^\\])\r/g, "$1\\r");
              
              message = JSON.parse(deepFixed);
              console.log("✅ Successfully parsed after deep fixing");
            } else {
              throw secondError;
            }
          } catch (thirdError: any) {
            console.error("Third parse attempt failed:", thirdError);
            console.error("Problematic content around position 2739:", 
              cleanedContent.substring(Math.max(0, 2700), Math.min(cleanedContent.length, 2800)));
            
            throw new Error(
              `Failed to parse JSON response from OpenAI. ` +
              `First error: ${parseError.message}. ` +
              `Second error: ${secondError.message}. ` +
              `Third error: ${thirdError.message}. ` +
              `Content length: ${cleanedContent.length} chars. ` +
              `Preview: ${cleanedContent.substring(0, 200)}...`
            );
          }
        }
      }

      if (!message.reading || !message.reading.cards) {
        throw new Error("Invalid response structure from GPT");
      }

      return {
        status: message.status || 200,
        reading: message.reading,
      };
    } catch (error) {
      console.error("Error interpreting tarot:", error);
      throw error;
    }
  },
});
