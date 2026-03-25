import { api } from "@/services/api";

export const chatbotService = {
  async sendMessage(message: string) {
    const { data } = await api.post<{ success: boolean; data: { reply: string } }>(
      "/chatbot/message",
      { message }
    );
    return data.data;
  }
};

