package com.techstore.product.service;

import com.techstore.common.audit.AuditLogRepository;
import com.techstore.common.exception.InsufficientStockException;
import com.techstore.product.dto.inventory.InventoryAdjustRequest;
import com.techstore.product.entity.ActiveStatus;
import com.techstore.product.entity.Branch;
import com.techstore.product.entity.Inventory;
import com.techstore.product.entity.Product;
import com.techstore.product.repository.BranchRepository;
import com.techstore.product.repository.BrandRepository;
import com.techstore.product.repository.CategoryRepository;
import com.techstore.product.repository.InventoryRepository;
import com.techstore.product.repository.ProductRepository;
import com.techstore.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * UC18 — Kiểm thử đồng thời (ADR-021). Dùng H2 riêng (uc18conc) và KHÔNG bọc @Transactional để
 * mỗi thao tác commit thật, khóa PESSIMISTIC_WRITE thực sự tranh chấp giữa các luồng.
 */
@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:uc18conc;DB_CLOSE_DELAY=-1;MODE=MySQL;NON_KEYWORDS=USER;LOCK_TIMEOUT=20000")
class InventoryConcurrencyTest {

    private static final int THREADS = 10;

    @Autowired private InventoryAdminService inventoryAdminService;
    @Autowired private ProductRepository productRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private BrandRepository brandRepository;
    @Autowired private BranchRepository branchRepository;
    @Autowired private InventoryRepository inventoryRepository;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private UserRepository userRepository;

    private Product newProduct() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        return productRepository.save(new Product(
                categoryRepository.findBySlug("laptop").orElseThrow(),
                brandRepository.findBySlug("nova").orElseThrow(),
                "Đồng thời " + suffix, "dong-thoi-" + suffix, "CONC-" + suffix.toUpperCase(),
                new BigDecimal("1000000"), new BigDecimal("800000"), null, null, ActiveStatus.ACTIVE));
    }

    /** Chạy cùng lúc {@code THREADS} tác vụ (cùng xuất phát nhờ latch) và trả về kết quả từng tác vụ. */
    private List<Object> runConcurrently(Callable<Object> task) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(THREADS);
        CountDownLatch ready = new CountDownLatch(THREADS);
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<Object>> futures = new ArrayList<>();
            for (int i = 0; i < THREADS; i++) {
                futures.add(pool.submit(() -> {
                    ready.countDown();
                    start.await();
                    try {
                        return task.call();
                    } catch (Exception ex) {
                        return ex;
                    }
                }));
            }
            assertTrue(ready.await(10, TimeUnit.SECONDS));
            start.countDown();
            List<Object> results = new ArrayList<>();
            for (Future<Object> f : futures) {
                results.add(f.get(60, TimeUnit.SECONDS));
            }
            return results;
        } finally {
            pool.shutdownNow();
        }
    }

    @Test
    @DisplayName("10 luồng OUTBOUND 3 cùng lúc trên tồn 20: đúng 6 thành công, 4 bị 409, tồn cuối 2, không âm, audit = số thành công")
    void concurrentOutboundNeverOversells() throws Exception {
        Long actor = userRepository.findByEmail("staff@techstore.vn").orElseThrow().getId();
        Product product = newProduct();
        Branch branch = branchRepository.save(new Branch("Kho đồng thời", null, "1 Test, TP.HCM", ActiveStatus.ACTIVE));
        inventoryRepository.saveAndFlush(new Inventory(product, branch, 20, 5));
        long auditBefore = auditLogRepository.countByEntityName("inventories");

        List<Object> results = runConcurrently(() -> inventoryAdminService.adjust(actor,
                new InventoryAdjustRequest(product.getId(), branch.getId(), "OUTBOUND", 3, "đồng thời")));

        long success = results.stream().filter(r -> !(r instanceof Exception)).count();
        long shortages = results.stream().filter(r -> r instanceof InsufficientStockException).count();
        List<Object> unexpected = results.stream()
                .filter(r -> r instanceof Exception && !(r instanceof InsufficientStockException)).toList();

        assertTrue(unexpected.isEmpty(), "Lỗi ngoài dự kiến: " + unexpected);
        assertEquals(6, success);
        assertEquals(4, shortages);
        int finalQty = inventoryRepository.findByProductIdAndBranchId(product.getId(), branch.getId()).orElseThrow().getQuantity();
        assertEquals(2, finalQty);
        assertTrue(finalQty >= 0);
        assertEquals(auditBefore + success, auditLogRepository.countByEntityName("inventories"));
    }

    @Test
    @DisplayName("10 luồng INBOUND 2 cùng lúc vào cặp chưa có dòng: chỉ tạo 1 dòng, tồn cuối 20, không lỗi")
    void concurrentInboundCreatesSingleRow() throws Exception {
        Long actor = userRepository.findByEmail("staff@techstore.vn").orElseThrow().getId();
        Product product = newProduct();
        Branch branch = branchRepository.save(new Branch("Kho tạo dòng", null, "2 Test, TP.HCM", ActiveStatus.ACTIVE));

        List<Object> results = runConcurrently(() -> inventoryAdminService.adjust(actor,
                new InventoryAdjustRequest(product.getId(), branch.getId(), "INBOUND", 2, null)));

        List<Object> errors = results.stream().filter(r -> r instanceof Exception).toList();
        assertTrue(errors.isEmpty(), "Không được có lỗi: " + errors);
        List<Inventory> rows = inventoryRepository.findByProductId(product.getId());
        assertEquals(1, rows.size());
        assertEquals(20, rows.get(0).getQuantity());
    }
}
