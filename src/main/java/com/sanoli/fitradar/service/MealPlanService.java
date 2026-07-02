package com.sanoli.fitradar.service;

import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.Food;
import com.sanoli.fitradar.domain.Meal;
import com.sanoli.fitradar.domain.MealItem;
import com.sanoli.fitradar.domain.Program;
import com.sanoli.fitradar.dto.MealItemRequest;
import com.sanoli.fitradar.dto.MealItemResponse;
import com.sanoli.fitradar.dto.MealRequest;
import com.sanoli.fitradar.dto.MealResponse;
import com.sanoli.fitradar.dto.NutritionPlanResponse;
import com.sanoli.fitradar.dto.ReorderRequest;
import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.exception.ForbiddenException;
import com.sanoli.fitradar.exception.ResourceNotFoundException;
import com.sanoli.fitradar.nutrition.engine.NutrientTotals;
import com.sanoli.fitradar.nutrition.engine.NutritionCalculationService;
import com.sanoli.fitradar.repository.EnrollmentRepository;
import com.sanoli.fitradar.repository.MealItemRepository;
import com.sanoli.fitradar.repository.MealRepository;
import com.sanoli.fitradar.repository.ProgramRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class MealPlanService {

    private final ProgramRepository programRepository;
    private final MealRepository mealRepository;
    private final MealItemRepository mealItemRepository;
    private final FoodService foodService;
    private final NutritionCalculationService nutritionCalculationService;
    private final EnrollmentRepository enrollmentRepository;
    private final CreatorSpaceGuard creatorSpaceGuard;

    public MealPlanService(
            ProgramRepository programRepository,
            MealRepository mealRepository,
            MealItemRepository mealItemRepository,
            FoodService foodService,
            NutritionCalculationService nutritionCalculationService,
            EnrollmentRepository enrollmentRepository,
            CreatorSpaceGuard creatorSpaceGuard
    ) {
        this.programRepository = programRepository;
        this.mealRepository = mealRepository;
        this.mealItemRepository = mealItemRepository;
        this.foodService = foodService;
        this.nutritionCalculationService = nutritionCalculationService;
        this.enrollmentRepository = enrollmentRepository;
        this.creatorSpaceGuard = creatorSpaceGuard;
    }

    @Transactional(readOnly = true)
    public NutritionPlanResponse getPlanForCreator(UUID creatorId, UUID programId) {
        Program program = requireProgram(creatorId, programId);
        return buildPlanResponse(program);
    }

    @Transactional(readOnly = true)
    public NutritionPlanResponse getPlanForStudent(AppUser student, UUID programId) {
        Program program = programRepository.findById(programId)
                .orElseThrow(() -> new ResourceNotFoundException("Plano alimentar não encontrado."));
        if (student.getCreatorId() == null || !student.getCreatorId().equals(program.getCreatorId())) {
            throw new ForbiddenException("Acesso negado ao plano.");
        }
        if (!enrollmentRepository.existsByStudentIdAndProgramIdAndActiveTrue(student.getId(), programId)) {
            throw new ForbiddenException("Matrícula ativa necessária para visualizar o plano.");
        }
        return buildPlanResponse(program);
    }

    @Transactional
    public MealResponse createMeal(UUID creatorId, UUID programId, MealRequest request) {
        creatorSpaceGuard.requireSpace(creatorId);
        creatorSpaceGuard.requireNutritionModule(creatorId);
        Program program = requireProgram(creatorId, programId);
        Meal meal = new Meal();
        meal.setProgramId(programId);
        meal.setCreatorId(creatorId);
        meal.setNome(request.nome().trim());
        meal.setHorario(request.horario());
        meal.setOrdem(resolveMealOrdem(programId, creatorId, request.ordem()));
        Meal saved = mealRepository.save(meal);
        markStructured(program);
        return MealResponse.of(saved, List.of(), NutrientTotals.zero());
    }

    @Transactional
    public MealResponse updateMeal(UUID creatorId, UUID programId, UUID mealId, MealRequest request) {
        creatorSpaceGuard.requireSpace(creatorId);
        creatorSpaceGuard.requireNutritionModule(creatorId);
        requireProgram(creatorId, programId);
        Meal meal = requireMeal(creatorId, programId, mealId);
        meal.setNome(request.nome().trim());
        meal.setHorario(request.horario());
        if (request.ordem() != null) {
            meal.setOrdem(request.ordem());
        }
        mealRepository.save(meal);
        return buildMealResponse(meal);
    }

    @Transactional
    public void deleteMeal(UUID creatorId, UUID programId, UUID mealId) {
        creatorSpaceGuard.requireSpace(creatorId);
        creatorSpaceGuard.requireNutritionModule(creatorId);
        requireProgram(creatorId, programId);
        Meal meal = requireMeal(creatorId, programId, mealId);
        mealItemRepository.findByMealIdOrderByOrdemAsc(mealId)
                .forEach(item -> mealItemRepository.deleteById(item.getId()));
        mealRepository.delete(meal);
    }

    @Transactional
    public void reorderMeals(UUID creatorId, UUID programId, ReorderRequest request) {
        creatorSpaceGuard.requireSpace(creatorId);
        creatorSpaceGuard.requireNutritionModule(creatorId);
        requireProgram(creatorId, programId);
        List<Meal> meals = mealRepository.findByProgramIdAndCreatorIdOrderByOrdemAsc(programId, creatorId);
        applyReorder(meals, request.orderedIds(), Meal::getId, Meal::setOrdem);
        mealRepository.saveAll(meals);
    }

    @Transactional
    public MealItemResponse addItem(UUID creatorId, UUID programId, UUID mealId, MealItemRequest request) {
        creatorSpaceGuard.requireSpace(creatorId);
        creatorSpaceGuard.requireNutritionModule(creatorId);
        requireProgram(creatorId, programId);
        Meal meal = requireMeal(creatorId, programId, mealId);
        Food food = foodService.requireAccessibleFood(creatorId, request.foodId());
        MealItem item = new MealItem();
        item.setMealId(meal.getId());
        item.setFoodId(food.getId());
        item.setQuantidadeG(request.quantidadeG());
        item.setOrdem(resolveItemOrdem(mealId, request.ordem()));
        MealItem saved = mealItemRepository.save(item);
        NutrientTotals totals = nutritionCalculationService.calculateItem(food, saved.getQuantidadeG());
        return MealItemResponse.of(saved, food.getNome(), food.getFonte().name(), totals);
    }

    @Transactional
    public MealItemResponse updateItem(
            UUID creatorId,
            UUID programId,
            UUID mealId,
            UUID itemId,
            MealItemRequest request
    ) {
        creatorSpaceGuard.requireSpace(creatorId);
        creatorSpaceGuard.requireNutritionModule(creatorId);
        requireProgram(creatorId, programId);
        requireMeal(creatorId, programId, mealId);
        MealItem item = requireItem(mealId, itemId);
        Food food = foodService.requireAccessibleFood(creatorId, request.foodId());
        item.setFoodId(food.getId());
        item.setQuantidadeG(request.quantidadeG());
        if (request.ordem() != null) {
            item.setOrdem(request.ordem());
        }
        MealItem saved = mealItemRepository.save(item);
        NutrientTotals totals = nutritionCalculationService.calculateItem(food, saved.getQuantidadeG());
        return MealItemResponse.of(saved, food.getNome(), food.getFonte().name(), totals);
    }

    @Transactional
    public void deleteItem(UUID creatorId, UUID programId, UUID mealId, UUID itemId) {
        creatorSpaceGuard.requireSpace(creatorId);
        creatorSpaceGuard.requireNutritionModule(creatorId);
        requireProgram(creatorId, programId);
        requireMeal(creatorId, programId, mealId);
        MealItem item = requireItem(mealId, itemId);
        mealItemRepository.delete(item);
    }

    @Transactional
    public void reorderItems(UUID creatorId, UUID programId, UUID mealId, ReorderRequest request) {
        creatorSpaceGuard.requireSpace(creatorId);
        creatorSpaceGuard.requireNutritionModule(creatorId);
        requireProgram(creatorId, programId);
        requireMeal(creatorId, programId, mealId);
        List<MealItem> items = mealItemRepository.findByMealIdOrderByOrdemAsc(mealId);
        applyReorder(items, request.orderedIds(), MealItem::getId, MealItem::setOrdem);
        mealItemRepository.saveAll(items);
    }

    private NutritionPlanResponse buildPlanResponse(Program program) {
        List<Meal> meals = mealRepository.findByProgramIdAndCreatorIdOrderByOrdemAsc(
                program.getId(), program.getCreatorId());
        if (meals.isEmpty()) {
            NutrientTotals zero = NutrientTotals.zero();
            return NutritionPlanResponse.of(program.getId(), program.isNutritionStructured(), List.of(), zero, zero);
        }

        List<UUID> mealIds = meals.stream().map(Meal::getId).toList();
        List<MealItem> allItems = mealItemRepository.findByMealIdInOrderByMealIdAscOrdemAsc(mealIds);
        Map<UUID, List<MealItem>> itemsByMeal = allItems.stream()
                .collect(Collectors.groupingBy(MealItem::getMealId));

        Map<UUID, Food> foods = loadFoods(program.getCreatorId(), allItems);

        List<MealResponse> mealResponses = new ArrayList<>();
        List<NutrientTotals> mealTotalsList = new ArrayList<>();

        for (Meal meal : meals) {
            List<MealItem> items = itemsByMeal.getOrDefault(meal.getId(), List.of());
            List<MealItemResponse> itemResponses = new ArrayList<>();
            List<NutrientTotals> itemTotals = new ArrayList<>();
            for (MealItem item : items) {
                Food food = foods.get(item.getFoodId());
                if (food == null) {
                    continue;
                }
                NutrientTotals totals = nutritionCalculationService.calculateItem(food, item.getQuantidadeG());
                itemTotals.add(totals);
                itemResponses.add(MealItemResponse.of(item, food.getNome(), food.getFonte().name(), totals));
            }
            NutrientTotals mealTotals = nutritionCalculationService.sum(itemTotals);
            mealTotalsList.add(mealTotals);
            mealResponses.add(MealResponse.of(meal, itemResponses, mealTotals));
        }

        NutrientTotals dailyTotals = nutritionCalculationService.sum(mealTotalsList);
        NutrientTotals weekly = nutritionCalculationService.weeklyProjection(dailyTotals);
        return NutritionPlanResponse.of(
                program.getId(),
                program.isNutritionStructured() || !meals.isEmpty(),
                mealResponses,
                dailyTotals,
                weekly
        );
    }

    private MealResponse buildMealResponse(Meal meal) {
        List<MealItem> items = mealItemRepository.findByMealIdOrderByOrdemAsc(meal.getId());
        Map<UUID, Food> foods = loadFoods(meal.getCreatorId(), items);
        List<MealItemResponse> itemResponses = new ArrayList<>();
        List<NutrientTotals> itemTotals = new ArrayList<>();
        for (MealItem item : items) {
            Food food = foods.get(item.getFoodId());
            if (food == null) {
                continue;
            }
            NutrientTotals totals = nutritionCalculationService.calculateItem(food, item.getQuantidadeG());
            itemTotals.add(totals);
            itemResponses.add(MealItemResponse.of(item, food.getNome(), food.getFonte().name(), totals));
        }
        return MealResponse.of(meal, itemResponses, nutritionCalculationService.sum(itemTotals));
    }

    private Map<UUID, Food> loadFoods(UUID creatorId, List<MealItem> items) {
        Map<UUID, Food> foods = new HashMap<>();
        for (MealItem item : items) {
            if (!foods.containsKey(item.getFoodId())) {
                foods.put(item.getFoodId(), foodService.requireAccessibleFood(creatorId, item.getFoodId()));
            }
        }
        return foods;
    }

    private Program requireProgram(UUID creatorId, UUID programId) {
        return programRepository.findByIdAndCreatorId(programId, creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Programa não encontrado."));
    }

    private Meal requireMeal(UUID creatorId, UUID programId, UUID mealId) {
        return mealRepository.findByIdAndProgramIdAndCreatorId(mealId, programId, creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Refeição não encontrada."));
    }

    private MealItem requireItem(UUID mealId, UUID itemId) {
        return mealItemRepository.findByIdAndMealId(itemId, mealId)
                .orElseThrow(() -> new ResourceNotFoundException("Item da refeição não encontrado."));
    }

    private void markStructured(Program program) {
        if (!program.isNutritionStructured()) {
            program.setNutritionStructured(true);
            programRepository.save(program);
        }
    }

    private int resolveMealOrdem(UUID programId, UUID creatorId, Integer requested) {
        if (requested != null && requested > 0) {
            return requested;
        }
        long count = mealRepository.findByProgramIdAndCreatorIdOrderByOrdemAsc(programId, creatorId).size();
        return (int) count + 1;
    }

    private int resolveItemOrdem(UUID mealId, Integer requested) {
        if (requested != null && requested > 0) {
            return requested;
        }
        return mealItemRepository.findByMealIdOrderByOrdemAsc(mealId).size() + 1;
    }

    private <T> void applyReorder(
            List<T> entities,
            List<UUID> orderedIds,
            Function<T, UUID> idGetter,
            java.util.function.BiConsumer<T, Integer> ordemSetter
    ) {
        Map<UUID, T> byId = entities.stream().collect(Collectors.toMap(idGetter, Function.identity()));
        if (orderedIds.size() != entities.size() || !byId.keySet().containsAll(orderedIds)) {
            throw new BusinessException("Lista de reordenação inválida.");
        }
        for (int i = 0; i < orderedIds.size(); i++) {
            T entity = byId.get(orderedIds.get(i));
            ordemSetter.accept(entity, i + 1);
        }
    }
}
