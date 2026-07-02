import { API_PREFIX } from "@/lib/auth/constants";
import { api } from "@/lib/api/client";
import type {
  CustomFoodRequest,
  FoodResponse,
  MealItemRequest,
  MealItemResponse,
  MealRequest,
  MealResponse,
  NutritionPlanResponse,
} from "@/lib/api/domain-types";

export const nutritionApi = {
  searchFoods(q: string) {
    return api.get<FoodResponse[]>(`${API_PREFIX}/foods?q=${encodeURIComponent(q)}`);
  },

  createCustomFood(body: CustomFoodRequest) {
    return api.post<FoodResponse>(`${API_PREFIX}/foods`, body);
  },

  getPlan(programId: string) {
    return api.get<NutritionPlanResponse>(`${API_PREFIX}/programs/${programId}/nutrition`);
  },

  getStudentPlan(programId: string) {
    return api.get<NutritionPlanResponse>(`${API_PREFIX}/my/programs/${programId}/nutrition`);
  },

  createMeal(programId: string, body: MealRequest) {
    return api.post<MealResponse>(`${API_PREFIX}/programs/${programId}/meals`, body);
  },

  updateMeal(programId: string, mealId: string, body: MealRequest) {
    return api.put<MealResponse>(`${API_PREFIX}/programs/${programId}/meals/${mealId}`, body);
  },

  deleteMeal(programId: string, mealId: string) {
    return api.delete<void>(`${API_PREFIX}/programs/${programId}/meals/${mealId}`);
  },

  addMealItem(programId: string, mealId: string, body: MealItemRequest) {
    return api.post<MealItemResponse>(
      `${API_PREFIX}/programs/${programId}/meals/${mealId}/items`,
      body,
    );
  },

  deleteMealItem(programId: string, mealId: string, itemId: string) {
    return api.delete<void>(
      `${API_PREFIX}/programs/${programId}/meals/${mealId}/items/${itemId}`,
    );
  },
};
