package com.sanoli.fitradar.repository;

import com.sanoli.fitradar.domain.Food;
import com.sanoli.fitradar.domain.FoodSource;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FoodRepository extends JpaRepository<Food, UUID> {

    @Query("""
            SELECT f FROM Food f
            WHERE (f.fonte = com.sanoli.fitradar.domain.FoodSource.TACO
                OR (f.fonte = com.sanoli.fitradar.domain.FoodSource.CUSTOM AND f.creatorId = :creatorId))
              AND LOWER(f.nome) LIKE LOWER(CONCAT('%', :query, '%'))
            ORDER BY f.nome ASC
            """)
    List<Food> search(@Param("creatorId") UUID creatorId, @Param("query") String query, Pageable pageable);

    Optional<Food> findByIdAndCreatorId(UUID id, UUID creatorId);

    Optional<Food> findByIdAndFonte(UUID id, FoodSource fonte);
}
