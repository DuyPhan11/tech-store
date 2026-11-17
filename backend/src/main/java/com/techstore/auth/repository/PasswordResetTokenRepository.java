package com.techstore.auth.repository;

import com.techstore.auth.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findTopByUserIdAndIsUsedFalseOrderByCreatedAtDesc(Long userId);

    Optional<PasswordResetToken> findTopByUserIdOrderByCreatedAtDesc(Long userId);
}
