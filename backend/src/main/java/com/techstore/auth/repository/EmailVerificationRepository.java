package com.techstore.auth.repository;

import com.techstore.auth.entity.EmailVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailVerificationRepository extends JpaRepository<EmailVerification, Long> {

    Optional<EmailVerification> findTopByEmailAndIsUsedFalseOrderByCreatedAtDesc(String email);

    Optional<EmailVerification> findTopByEmailOrderByCreatedAtDesc(String email);
}
