package com.sanoli.fitradar.repository;

import com.sanoli.fitradar.domain.MealItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MealItemRepository extends JpaRepository<MealItem, UUID> {

    List<MealItem> findByMealIdOrderByOrdemAsc(UUID mealId);

    List<MealItem> findByMealIdInOrderByMealIdAscOrdemAsc(List<UUID> mealIds);

    Optional<MealItem> findByIdAndMealId(UUID id, UUID mealId);
}
