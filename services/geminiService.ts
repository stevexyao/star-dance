
import { GoogleGenAI, Type } from "@google/genai";
import { ParticleTheme } from "../types";

export const getAITheme = async (prompt: string): Promise<Partial<ParticleTheme>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite-latest",
      contents: `你是一个专业的生成艺术视觉设计师。根据用户描述的意境： "${prompt}"，生成一组最符合该意境的粒子系统物理和视觉配置。
      请仅返回 JSON 格式的配置数据。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            colors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "包含 4 个十六进制颜色代码的数组"
            },
            maxSpeed: { type: Type.NUMBER, description: "粒子最大速度 (0.5 - 5.0)" },
            friction: { type: Type.NUMBER, description: "摩擦力/粘滞系数 (0.9 - 0.999)" },
            particleCount: { type: Type.INTEGER, description: "粒子数量 (500 - 3000)" },
            glow: { type: Type.BOOLEAN, description: "是否开启发光效果" },
            interactionForce: { type: Type.NUMBER, description: "手势交互力度，正数为吸引，负数为排斥 (-1.0 到 1.0)" }
          },
          required: ["colors", "maxSpeed", "friction", "particleCount", "glow", "interactionForce"]
        }
      }
    });

    const config = JSON.parse(response.text);
    return config;
  } catch (error) {
    console.error("Gemini failed to generate theme:", error);
    return {};
  }
};
