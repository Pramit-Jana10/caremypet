import { api } from "@/services/api";

export type FeedbackPayload = {
  name: string;
  email: string;
  message: string;
};

export const contactService = {
  async sendFeedback(payload: FeedbackPayload): Promise<{ message: string }> {
    const { data } = await api.post<{ success: boolean; data: { message: string } }>(
      "/contact/feedback",
      payload
    );
    return data.data;
  }
};
