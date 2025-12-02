import { GoogleGenAI, Chat } from "@google/genai";

let chatSession: Chat | null = null;

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const initializeChat = async () => {
  const ai = getClient();
  if (!ai) return null;

  try {
    chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `You are 'Manang Aura', a warm, knowledgeable, and helpful digital assistant for 'Tatak Norte', a marketplace for Ilocos Norte products.
        
        Your Goal: Help users discover authentic Ilocano products (Inabel weaving, Burnay pottery, Delicacies) and educate them about Ilocano culture.
        
        Tone: Friendly, hospitable (like an Ilocano host), respectful, and concise. Use English primarily but feel free to sprinkle common Ilocano greetings like "Naimbag nga aldaw" (Good day) or "Agyamanak" (Thank you).

        Knowledge Base:
        - Inabel: Traditional handwoven fabric, sturdy, culturally significant.
        - Burnay: Earthenware jars, durable, used for fermentation.
        - Food: Bagnet (crispy pork), Empanada (orange pastry), Chichacorn (corn snack).
        - Places: Paoay Church, Bangui Windmills, Vigan (nearby heritage city).

        Constraints:
        - If asked about products not in our catalog, gently steer them back to Ilocano specialties.
        - Keep responses under 100 words unless asked for a detailed history.
        `
      }
    });
    return chatSession;
  } catch (error) {
    console.error("Failed to init chat", error);
    return null;
  }
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  if (!chatSession) {
    await initializeChat();
  }

  if (!chatSession) {
    return "I'm having trouble connecting to the internet right now. Please try again later. Agyamanak!";
  }

  try {
    const result = await chatSession.sendMessage({ message });
    return result.text || "I didn't catch that. Could you say it again?";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Something went wrong. Please try again.";
  }
};
