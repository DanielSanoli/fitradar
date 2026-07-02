package com.sanoli.fitradar.controller;

import com.sanoli.fitradar.dto.CustomFoodRequest;
import com.sanoli.fitradar.dto.FoodResponse;
import com.sanoli.fitradar.dto.MealItemRequest;
import com.sanoli.fitradar.dto.MealItemResponse;
import com.sanoli.fitradar.dto.MealRequest;
import com.sanoli.fitradar.dto.MealResponse;
import com.sanoli.fitradar.dto.NutritionPlanResponse;
import com.sanoli.fitradar.dto.ReorderRequest;
import com.sanoli.fitradar.security.CurrentUserService;
import com.sanoli.fitradar.service.FoodService;
import com.sanoli.fitradar.service.MealPlanService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class NutritionController {

    private final FoodService foodService;
    private final MealPlanService mealPlanService;
    private final CurrentUserService currentUserService;

    public NutritionController(
            FoodService foodService,
            MealPlanService mealPlanService,
            CurrentUserService currentUserService
    ) {
        this.foodService = foodService;
        this.mealPlanService = mealPlanService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/foods")
    @Operation(summary = "Busca alimentos TACO + custom do criador")
    public ResponseEntity<List<FoodResponse>> searchFoods(@RequestParam("q") String query) {
        UUID creatorId = currentUserService.requireCreator().getId();
        return ResponseEntity.ok(foodService.search(creatorId, query));
    }

    @PostMapping("/foods")
    @Operation(summary = "Cria alimento custom do criador")
    public ResponseEntity<FoodResponse> createCustomFood(@Valid @RequestBody CustomFoodRequest request) {
        UUID creatorId = currentUserService.requireCreator().getId();
        return ResponseEntity.status(HttpStatus.CREATED).body(foodService.createCustom(creatorId, request));
    }

    @GetMapping("/programs/{programId}/nutrition")
    @Operation(summary = "Plano alimentar estruturado com totais calculados")
    public ResponseEntity<NutritionPlanResponse> getNutritionPlan(@PathVariable UUID programId) {
        UUID creatorId = currentUserService.requireCreator().getId();
        return ResponseEntity.ok(mealPlanService.getPlanForCreator(creatorId, programId));
    }

    @PostMapping("/programs/{programId}/meals")
    @Operation(summary = "Adiciona refeição ao plano")
    public ResponseEntity<MealResponse> createMeal(
            @PathVariable UUID programId,
            @Valid @RequestBody MealRequest request
    ) {
        UUID creatorId = currentUserService.requireCreator().getId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mealPlanService.createMeal(creatorId, programId, request));
    }

    @PutMapping("/programs/{programId}/meals/{mealId}")
    @Operation(summary = "Atualiza refeição")
    public ResponseEntity<MealResponse> updateMeal(
            @PathVariable UUID programId,
            @PathVariable UUID mealId,
            @Valid @RequestBody MealRequest request
    ) {
        UUID creatorId = currentUserService.requireCreator().getId();
        return ResponseEntity.ok(mealPlanService.updateMeal(creatorId, programId, mealId, request));
    }

    @DeleteMapping("/programs/{programId}/meals/{mealId}")
    @Operation(summary = "Remove refeição")
    public ResponseEntity<Void> deleteMeal(@PathVariable UUID programId, @PathVariable UUID mealId) {
        UUID creatorId = currentUserService.requireCreator().getId();
        mealPlanService.deleteMeal(creatorId, programId, mealId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/programs/{programId}/meals/reorder")
    @Operation(summary = "Reordena refeições")
    public ResponseEntity<Void> reorderMeals(
            @PathVariable UUID programId,
            @Valid @RequestBody ReorderRequest request
    ) {
        UUID creatorId = currentUserService.requireCreator().getId();
        mealPlanService.reorderMeals(creatorId, programId, request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/programs/{programId}/meals/{mealId}/items")
    @Operation(summary = "Adiciona alimento à refeição")
    public ResponseEntity<MealItemResponse> addMealItem(
            @PathVariable UUID programId,
            @PathVariable UUID mealId,
            @Valid @RequestBody MealItemRequest request
    ) {
        UUID creatorId = currentUserService.requireCreator().getId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mealPlanService.addItem(creatorId, programId, mealId, request));
    }

    @PutMapping("/programs/{programId}/meals/{mealId}/items/{itemId}")
    @Operation(summary = "Atualiza item da refeição")
    public ResponseEntity<MealItemResponse> updateMealItem(
            @PathVariable UUID programId,
            @PathVariable UUID mealId,
            @PathVariable UUID itemId,
            @Valid @RequestBody MealItemRequest request
    ) {
        UUID creatorId = currentUserService.requireCreator().getId();
        return ResponseEntity.ok(mealPlanService.updateItem(creatorId, programId, mealId, itemId, request));
    }

    @DeleteMapping("/programs/{programId}/meals/{mealId}/items/{itemId}")
    @Operation(summary = "Remove item da refeição")
    public ResponseEntity<Void> deleteMealItem(
            @PathVariable UUID programId,
            @PathVariable UUID mealId,
            @PathVariable UUID itemId
    ) {
        UUID creatorId = currentUserService.requireCreator().getId();
        mealPlanService.deleteItem(creatorId, programId, mealId, itemId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/programs/{programId}/meals/{mealId}/items/reorder")
    @Operation(summary = "Reordena itens da refeição")
    public ResponseEntity<Void> reorderMealItems(
            @PathVariable UUID programId,
            @PathVariable UUID mealId,
            @Valid @RequestBody ReorderRequest request
    ) {
        UUID creatorId = currentUserService.requireCreator().getId();
        mealPlanService.reorderItems(creatorId, programId, mealId, request);
        return ResponseEntity.noContent().build();
    }
}
