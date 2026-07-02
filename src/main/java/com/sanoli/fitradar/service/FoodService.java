package com.sanoli.fitradar.service;

import com.sanoli.fitradar.domain.Food;
import com.sanoli.fitradar.domain.FoodSource;
import com.sanoli.fitradar.dto.CustomFoodRequest;
import com.sanoli.fitradar.dto.FoodResponse;
import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.exception.ResourceNotFoundException;
import com.sanoli.fitradar.repository.FoodRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
public class FoodService {

    private static final int MAX_SEARCH = 25;

    private final FoodRepository foodRepository;
    private final CreatorSpaceGuard creatorSpaceGuard;

    public FoodService(FoodRepository foodRepository, CreatorSpaceGuard creatorSpaceGuard) {
        this.foodRepository = foodRepository;
        this.creatorSpaceGuard = creatorSpaceGuard;
    }

    @Transactional(readOnly = true)
    public List<FoodResponse> search(UUID creatorId, String query) {
        String normalized = query == null ? "" : query.trim();
        if (normalized.length() < 2) {
            throw new BusinessException("Informe ao menos 2 caracteres para buscar alimentos.");
        }
        return foodRepository.search(creatorId, normalized, PageRequest.of(0, MAX_SEARCH)).stream()
                .map(FoodResponse::fromEntity)
                .toList();
    }

    @Transactional
    public FoodResponse createCustom(UUID creatorId, CustomFoodRequest request) {
        creatorSpaceGuard.requireSpace(creatorId);
        Food food = new Food();
        food.setNome(request.nome().trim());
        food.setFonte(FoodSource.CUSTOM);
        food.setCreatorId(creatorId);
        food.setKcalPor100g(scale(request.kcalPor100g()));
        food.setProteinaPor100g(scale(request.proteinaPor100g()));
        food.setCarboPor100g(scale(request.carboPor100g()));
        food.setGorduraPor100g(scale(request.gorduraPor100g()));
        return FoodResponse.fromEntity(foodRepository.save(food));
    }

    @Transactional(readOnly = true)
    public Food requireAccessibleFood(UUID creatorId, UUID foodId) {
        Food taco = foodRepository.findByIdAndFonte(foodId, FoodSource.TACO).orElse(null);
        if (taco != null) {
            return taco;
        }
        return foodRepository.findByIdAndCreatorId(foodId, creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Alimento não encontrado."));
    }

    private BigDecimal scale(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_EVEN);
    }
}
