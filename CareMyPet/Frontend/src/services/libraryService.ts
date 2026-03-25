import { api } from "@/services/api";
import type { KnowledgeArticle, TrainingCourse } from "@/utils/types";

export const libraryService = {
  async listTrainingCourses(petType?: string) {
    const { data } = await api.get<{ success: boolean; data: TrainingCourse[] }>(
      "/learning/courses",
      { params: petType ? { petType } : undefined }
    );
    return data.data;
  },

  async listKnowledgeArticles(category?: string) {
    const { data } = await api.get<{ success: boolean; data: KnowledgeArticle[] }>(
      "/learning/articles",
      { params: category ? { category } : undefined }
    );
    return data.data;
  }
};
