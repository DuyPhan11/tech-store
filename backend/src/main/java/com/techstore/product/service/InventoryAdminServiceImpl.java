package com.techstore.product.service;

import com.techstore.common.audit.AuditLogService;
import com.techstore.common.exception.CatalogResourceNotFoundException;
import com.techstore.common.exception.DuplicateResourceException;
import com.techstore.common.exception.InsufficientStockException;
import com.techstore.common.exception.ProductNotFoundException;
import com.techstore.product.dto.inventory.InventoryAdjustRequest;
import com.techstore.product.dto.inventory.InventoryBranchOption;
import com.techstore.product.dto.inventory.InventoryItemResponse;
import com.techstore.product.dto.inventory.InventoryTransferRequest;
import com.techstore.product.dto.inventory.InventoryTransferResponse;
import com.techstore.product.entity.ActiveStatus;
import com.techstore.product.entity.Branch;
import com.techstore.product.entity.Inventory;
import com.techstore.product.entity.Product;
import com.techstore.product.repository.BranchRepository;
import com.techstore.product.repository.InventoryRepository;
import com.techstore.product.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Luồng theo sequence UC18 (ADR-021):
 * kiểm tra chi nhánh ACTIVE → khóa sản phẩm (tuần tự hóa thao tác kho cùng sản phẩm, chống tạo trùng dòng)
 * → khóa dòng tồn (TRANSFER theo branchId tăng dần) → tính số lượng mới, chặn âm → lưu → ghi audit cùng transaction.
 */
@Service
public class InventoryAdminServiceImpl implements InventoryAdminService {

    private static final Logger log = LoggerFactory.getLogger(InventoryAdminServiceImpl.class);

    static final String ENTITY_NAME = "inventories";
    static final int DEFAULT_MIN_STOCK_ALERT = 5;

    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;
    private final BranchRepository branchRepository;
    private final AuditLogService auditLogService;

    public InventoryAdminServiceImpl(InventoryRepository inventoryRepository,
                                     ProductRepository productRepository,
                                     BranchRepository branchRepository,
                                     AuditLogService auditLogService) {
        this.inventoryRepository = inventoryRepository;
        this.productRepository = productRepository;
        this.branchRepository = branchRepository;
        this.auditLogService = auditLogService;
    }

    // ===================== Read =====================

    @Override
    @Transactional(readOnly = true)
    public List<InventoryItemResponse> listInventories(Long branchId, String keyword) {
        String pattern = keyword == null || keyword.isBlank() ? null : "%" + keyword.trim().toLowerCase() + "%";
        return inventoryRepository.searchForAdmin(branchId, pattern).stream()
                .map(InventoryItemResponse::of)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryBranchOption> listBranches() {
        return branchRepository.findAll(Sort.by(Sort.Direction.ASC, "id")).stream()
                .map(b -> new InventoryBranchOption(b.getId(), b.getName(), b.getStatus().name()))
                .toList();
    }

    // ===================== Adjust =====================

    @Override
    @Transactional
    public InventoryItemResponse adjust(Long actorUserId, InventoryAdjustRequest request) {
        String type = request.type();
        int quantity = request.quantity();
        if (!"SET".equals(type) && quantity <= 0) {
            throw new IllegalArgumentException("Số lượng nhập/xuất phải lớn hơn 0");
        }
        Branch branch = requireActiveBranch(request.branchId());
        Product product = lockProduct(request.productId());

        Inventory inventory = inventoryRepository
                .findByProductIdAndBranchIdForUpdate(product.getId(), branch.getId())
                .orElse(null);
        if (inventory == null) {
            if ("OUTBOUND".equals(type)) {
                throw shortage(product, branch, 0, quantity);
            }
            inventory = createRow(product, branch);
        }

        int before = inventory.getQuantity();
        int after = switch (type) {
            case "INBOUND" -> addChecked(before, quantity);
            case "OUTBOUND" -> {
                if (before < quantity) {
                    throw shortage(product, branch, before, quantity);
                }
                yield before - quantity;
            }
            case "SET" -> quantity;
            default -> throw new IllegalArgumentException("Loại điều chỉnh chỉ nhận INBOUND, OUTBOUND hoặc SET");
        };
        inventory.setQuantity(after);
        Inventory saved = save(inventory);

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("productId", product.getId());
        details.put("sku", product.getSku());
        details.put("branchId", branch.getId());
        details.put("type", type);
        details.put("quantity", quantity);
        details.put("before", before);
        details.put("after", after);
        details.put("reason", blankToNull(request.reason()));
        auditLogService.record(actorUserId, "INVENTORY_" + type, ENTITY_NAME, saved.getId(), details);

        log.info("Điều chỉnh tồn {}: product={}, branch={}, {} -> {}, by user={}",
                type, product.getId(), branch.getId(), before, after, actorUserId);
        return InventoryItemResponse.of(saved);
    }

    // ===================== Transfer =====================

    @Override
    @Transactional
    public InventoryTransferResponse transfer(Long actorUserId, InventoryTransferRequest request) {
        if (request.fromBranchId().equals(request.toBranchId())) {
            throw new IllegalArgumentException("Chi nhánh xuất và chi nhánh nhận phải khác nhau");
        }
        int quantity = request.quantity();
        if (quantity <= 0) {
            throw new IllegalArgumentException("Số lượng chuyển phải lớn hơn 0");
        }
        Branch from = requireActiveBranch(request.fromBranchId());
        Branch to = requireActiveBranch(request.toBranchId());
        Product product = lockProduct(request.productId());

        // Khóa hai dòng theo thứ tự branchId tăng dần để tránh deadlock giữa các lệnh chuyển ngược chiều
        boolean fromFirst = from.getId() < to.getId();
        Inventory firstLocked = lockRow(product, fromFirst ? from : to);
        Inventory secondLocked = lockRow(product, fromFirst ? to : from);
        Inventory source = fromFirst ? firstLocked : secondLocked;
        Inventory target = fromFirst ? secondLocked : firstLocked;

        int sourceBefore = source != null ? source.getQuantity() : 0;
        if (source == null || sourceBefore < quantity) {
            throw shortage(product, from, sourceBefore, quantity);
        }
        if (target == null) {
            target = createRow(product, to);
        }
        int targetBefore = target.getQuantity();

        source.setQuantity(sourceBefore - quantity);
        target.setQuantity(addChecked(targetBefore, quantity));
        Inventory savedSource = save(source);
        Inventory savedTarget = save(target);

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("productId", product.getId());
        details.put("sku", product.getSku());
        details.put("fromBranchId", from.getId());
        details.put("toBranchId", to.getId());
        details.put("quantity", quantity);
        details.put("fromBefore", sourceBefore);
        details.put("fromAfter", savedSource.getQuantity());
        details.put("toBefore", targetBefore);
        details.put("toAfter", savedTarget.getQuantity());
        details.put("toInventoryId", savedTarget.getId());
        details.put("reason", blankToNull(request.reason()));
        auditLogService.record(actorUserId, "INVENTORY_TRANSFER", ENTITY_NAME, savedSource.getId(), details);

        log.info("Chuyển kho: product={}, {} -> {}, qty={}, by user={}",
                product.getId(), from.getId(), to.getId(), quantity, actorUserId);
        return new InventoryTransferResponse(InventoryItemResponse.of(savedSource), InventoryItemResponse.of(savedTarget));
    }

    // ===================== Helpers =====================

    /** checkActiveBranches (sequence UC18): không tồn tại → 404, INACTIVE → 400. */
    private Branch requireActiveBranch(Long branchId) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new CatalogResourceNotFoundException("Không tìm thấy chi nhánh: " + branchId));
        if (branch.getStatus() != ActiveStatus.ACTIVE) {
            throw new IllegalArgumentException("Chi nhánh '" + branch.getName() + "' đang tạm dừng hoạt động, không thể thao tác kho");
        }
        return branch;
    }

    private Product lockProduct(Long productId) {
        return productRepository.findByIdForUpdate(productId)
                .orElseThrow(() -> new ProductNotFoundException("Không tìm thấy sản phẩm: " + productId));
    }

    private Inventory lockRow(Product product, Branch branch) {
        return inventoryRepository.findByProductIdAndBranchIdForUpdate(product.getId(), branch.getId()).orElse(null);
    }

    /** Tạo dòng tồn mới (0). An toàn vì đang giữ khóa sản phẩm; vi phạm unique (nếu lọt) → 409. */
    private Inventory createRow(Product product, Branch branch) {
        return save(new Inventory(product, branch, 0, DEFAULT_MIN_STOCK_ALERT));
    }

    private Inventory save(Inventory inventory) {
        try {
            return inventoryRepository.saveAndFlush(inventory);
        } catch (DataIntegrityViolationException ex) {
            throw new DuplicateResourceException("Xung đột dữ liệu tồn kho, vui lòng tải lại và thử lại");
        }
    }

    private static int addChecked(int current, int delta) {
        try {
            return Math.addExact(current, delta);
        } catch (ArithmeticException ex) {
            throw new IllegalArgumentException("Số lượng tồn vượt quá giới hạn cho phép");
        }
    }

    private static InsufficientStockException shortage(Product product, Branch branch, int available, int requested) {
        return new InsufficientStockException("Không đủ hàng: " + product.getName() + " tại " + branch.getName()
                + " chỉ còn " + available + ", yêu cầu " + requested);
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
