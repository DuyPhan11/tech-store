package com.techstore.product.service;

import com.techstore.common.exception.BranchHasOpenOrdersException;
import com.techstore.common.exception.CatalogResourceNotFoundException;
import com.techstore.order.entity.OrderStatus;
import com.techstore.order.repository.OrderRepository;
import com.techstore.product.dto.admin.AdminBranchRequest;
import com.techstore.product.dto.admin.AdminBranchResponse;
import com.techstore.product.entity.ActiveStatus;
import com.techstore.product.entity.Branch;
import com.techstore.product.repository.BranchRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/**
 * Luồng theo sequence UC19: khóa chi nhánh (PESSIMISTIC_WRITE) → kiểm tra dữ liệu →
 * nếu ngừng hoạt động thì kiểm tra đơn chưa kết thúc → lưu.
 */
@Service
@Transactional
public class AdminBranchServiceImpl implements AdminBranchService {

    private static final Logger log = LoggerFactory.getLogger(AdminBranchServiceImpl.class);

    /** Đơn chưa kết thúc (BUSINESS_RULES §5): chi nhánh còn các đơn này không được vô hiệu hóa. */
    static final Set<OrderStatus> OPEN_ORDER_STATUSES =
            EnumSet.of(OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.SHIPPING);

    private final BranchRepository branchRepository;
    private final OrderRepository orderRepository;

    public AdminBranchServiceImpl(BranchRepository branchRepository, OrderRepository orderRepository) {
        this.branchRepository = branchRepository;
        this.orderRepository = orderRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminBranchResponse> listBranches() {
        return branchRepository.findAll(Sort.by(Sort.Direction.ASC, "id")).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public AdminBranchResponse createBranch(AdminBranchRequest request) {
        Branch branch = new Branch();
        apply(branch, request);
        branch.setStatus(ActiveStatus.ACTIVE);
        Branch saved = branchRepository.saveAndFlush(branch);
        log.info("Admin tạo chi nhánh: id={}, name={}", saved.getId(), saved.getName());
        return toResponse(saved);
    }

    @Override
    public AdminBranchResponse updateBranch(Long id, AdminBranchRequest request) {
        Branch branch = lockBranch(id);
        apply(branch, request);
        Branch saved = branchRepository.saveAndFlush(branch);
        log.info("Admin cập nhật chi nhánh: id={}", saved.getId());
        return toResponse(saved);
    }

    @Override
    public AdminBranchResponse updateStatus(Long id, String status) {
        ActiveStatus target = parseStatus(status);
        Branch branch = lockBranch(id);
        if (target == ActiveStatus.INACTIVE && branch.getStatus() != ActiveStatus.INACTIVE) {
            long openOrders = orderRepository.countByBranchIdAndStatusIn(id, OPEN_ORDER_STATUSES);
            if (openOrders > 0) {
                throw new BranchHasOpenOrdersException("Chi nhánh còn " + openOrders
                        + " đơn hàng chưa hoàn tất (chờ xác nhận / đã xác nhận / đang giao), không thể ngừng hoạt động");
            }
        }
        branch.setStatus(target);
        Branch saved = branchRepository.saveAndFlush(branch);
        log.info("Admin đổi trạng thái chi nhánh: id={}, status={}", saved.getId(), saved.getStatus());
        return toResponse(saved);
    }

    private Branch lockBranch(Long id) {
        return branchRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new CatalogResourceNotFoundException("Không tìm thấy chi nhánh: " + id));
    }

    private static void apply(Branch branch, AdminBranchRequest request) {
        branch.setName(request.name().trim());
        branch.setPhone(blankToNull(request.phone()));
        branch.setAddress(request.address().trim());
    }

    private AdminBranchResponse toResponse(Branch b) {
        return new AdminBranchResponse(
                b.getId(),
                b.getName(),
                b.getPhone(),
                b.getAddress(),
                b.getStatus().name(),
                b.getCreatedAt(),
                b.getUpdatedAt()
        );
    }

    private static ActiveStatus parseStatus(String status) {
        try {
            return ActiveStatus.valueOf(status.trim());
        } catch (IllegalArgumentException | NullPointerException ex) {
            throw new IllegalArgumentException("Trạng thái chỉ nhận ACTIVE hoặc INACTIVE");
        }
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
