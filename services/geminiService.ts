
import { GoogleGenAI, Type } from "@google/genai";
import { QuotationItem } from '../types';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

export const extractItemsFromFile = async (file: File): Promise<QuotationItem[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = await fileToBase64(file);

  const imagePart = {
    inlineData: {
      mimeType: file.type,
      data: base64Data,
    },
  };

  const textPart = {
    text: `Eres un asistente experto en extracción de datos. Analiza el documento adjunto. Extrae todos los productos o servicios, identificando descripción, cantidad y precio unitario. Devuelve los datos como un arreglo JSON de objetos con las claves 'description' (string), 'quantity' (number), y 'unitPrice' (number). Los valores numéricos deben ser números, no texto. Si no encuentras un valor, usa 0. Si no encuentras ningún producto, devuelve un arreglo vacío [].`,
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [textPart, imagePart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              quantity: { type: Type.NUMBER },
              unitPrice: { type: Type.NUMBER },
            },
            required: ["description", "quantity", "unitPrice"],
          },
        },
      },
    });

    const jsonString = response.text.trim();
    const extractedData = JSON.parse(jsonString);

    // Validate and add a unique ID to each item
    if (Array.isArray(extractedData)) {
      return extractedData.map((item, index) => ({
        ...item,
        id: `item-${Date.now()}-${index}`,
        quantity: typeof item.quantity === 'number' ? item.quantity : 1,
        unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : 0,
        description: typeof item.description === 'string' ? item.description : 'Sin descripción'
      }));
    }
    return [];

  } catch (error) {
    console.error("Error extracting data with Gemini:", error);
    throw new Error("No se pudieron extraer los datos del archivo. Intenta con un documento más claro.");
  }
};