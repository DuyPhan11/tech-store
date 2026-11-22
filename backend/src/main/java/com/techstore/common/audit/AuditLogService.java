package com.techstore.common.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Map;

/**
 * Ghi audit trong CÙNG transaction của nghiệp vụ (Propagation.MANDATORY): nghiệp vụ rollback thì audit cũng rollback,
 * nên thao tác lỗi không để lại dấu vết sai (ADR-021).
 */
@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public AuditLogService(AuditLogRepository auditLogRepository, ObjectMapper objectMapper) {
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public AuditLog record(Long userId, String action, String entityName, Long entityId, Map<String, ?> details) {
        String json;
        try {
            json = details != null ? objectMapper.writeValueAsString(details) : null;
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Không thể ghi chi tiết audit", ex);
        }
        return auditLogRepository.save(new AuditLog(userId, action, entityName, entityId, json, currentIp()));
    }

    private static String currentIp() {
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        if (attributes instanceof ServletRequestAttributes servlet) {
            String ip = servlet.getRequest().getRemoteAddr();
            return ip != null && ip.length() > 50 ? ip.substring(0, 50) : ip;
        }
        return null;
    }
}
