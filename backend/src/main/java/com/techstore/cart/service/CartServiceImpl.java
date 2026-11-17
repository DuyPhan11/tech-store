package com.techstore.cart.service;

import com.techstore.cart.dto.AddToCartRequest;
import com.techstore.cart.dto.CartItemResponse;
import com.techstore.cart.dto.CartResponse;
import com.techstore.cart.entity.Cart;
import com.techstore.cart.entity.CartItem;
import com.techstore.cart.repository.CartItemRepository;
import com.techstore.cart.repository.CartRepository;
import com.techstore.common.exception.CartItemNotFoundException;
import com.techstore.common.exception.ProductNotFoundException;
import com.techstore.product.entity.ActiveStatus;
import com.techstore.product.entity.Inventory;
import com.techstore.product.entity.Product;
import com.techstore.product.entity.ProductImage;
import com.techstore.product.repository.InventoryRepository;
import com.techstore.product.repository.ProductImageRepository;
import com.techstore.product.repository.ProductRepository;
import com.techstore.user.entity.User;
import com.techstore.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final InventoryRepository inventoryRepository;

    public CartServiceImpl(CartRepository cartRepository,
                           CartItemRepository cartItemRepository,
                           UserRepository userRepository,
                           ProductRepository productRepository,
                           ProductImageRepository productImageRepository,
                           InventoryRepository inventoryRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.productImageRepository = productImageRepository;
        this.inventoryRepository = inventoryRepository;
    }

    @Override
    public CartResponse getCart(Long userId) {
        Cart cart = getOrCreateCart(userId);
        return buildCartResponse(cart);
    }

    @Override
    public CartResponse addToCart(Long userId, AddToCartRequest request) {
        if (request == null || request.getProductId() == null) {
            throw new IllegalArgumentException("Thông tin sản phẩm thêm vào giỏ không hợp lệ");
        }
        int quantityToAdd = request.getQuantity() != null ? request.getQuantity() : 1;
        if (quantityToAdd < 1) {
            throw new IllegalArgumentException("Số lượng phải lớn hơn hoặc bằng 1");
        }

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ProductNotFoundException("Không tìm thấy sản phẩm với id: " + request.getProductId()));

        if (product.getStatus() != ActiveStatus.ACTIVE) {
            throw new ProductNotFoundException("Sản phẩm không tồn tại hoặc đã ngừng kinh doanh");
        }

        Cart cart = getOrCreateCart(userId);

        Optional<CartItem> existingItem = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());
        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            item.setQuantity(item.getQuantity() + quantityToAdd);
            cartItemRepository.save(item);
        } else {
            CartItem newItem = new CartItem(cart, product, quantityToAdd);
            cartItemRepository.save(newItem);
        }

        return buildCartResponse(cart);
    }

    @Override
    public CartResponse updateItemQuantity(Long userId, Long itemId, Integer quantity) {
        if (quantity == null || quantity < 1) {
            throw new IllegalArgumentException("Số lượng phải lớn hơn hoặc bằng 1");
        }

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new CartItemNotFoundException("Không tìm thấy mục giỏ hàng với id: " + itemId));

        // Kiểm tra quyền sở hữu giỏ hàng
        if (item.getCart() == null || item.getCart().getUser() == null || !item.getCart().getUser().getId().equals(userId)) {
            throw new CartItemNotFoundException("Mục giỏ hàng không thuộc quyền sở hữu của bạn");
        }

        item.setQuantity(quantity);
        cartItemRepository.save(item);

        return buildCartResponse(item.getCart());
    }

    @Override
    public CartResponse removeItem(Long userId, Long itemId) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new CartItemNotFoundException("Không tìm thấy mục giỏ hàng với id: " + itemId));

        // Kiểm tra quyền sở hữu giỏ hàng
        if (item.getCart() == null || item.getCart().getUser() == null || !item.getCart().getUser().getId().equals(userId)) {
            throw new CartItemNotFoundException("Mục giỏ hàng không thuộc quyền sở hữu của bạn");
        }

        Cart cart = item.getCart();
        cartItemRepository.delete(item);

        return buildCartResponse(cart);
    }

    @Override
    public CartResponse clearCart(Long userId) {
        Cart cart = getOrCreateCart(userId);
        cartItemRepository.deleteAllByCartId(cart.getId());
        return buildCartResponse(cart);
    }

    /**
     * Lấy giỏ hàng của user nếu đã có, hoặc tự động tạo giỏ hàng mới nếu chưa có.
     */
    private Cart getOrCreateCart(Long userId) {
        return cartRepository.findByUserId(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với id: " + userId));
            Cart newCart = new Cart(user);
            return cartRepository.save(newCart);
        });
    }

    /**
     * Chuyển đổi Cart entity thành CartResponse DTO kèm thông tin giá, hình ảnh và tồn kho hiện tại.
     */
    private CartResponse buildCartResponse(Cart cart) {
        List<CartItem> items = cartItemRepository.findByCartIdOrderByIdAsc(cart.getId());
        List<CartItemResponse> itemResponses = new ArrayList<>();

        int totalItems = 0;
        long totalPriceVnd = 0L;

        for (CartItem item : items) {
            Product product = item.getProduct();
            long priceVnd = product.getPrice() != null ? product.getPrice().longValue() : 0L;
            long subtotal = priceVnd * item.getQuantity();

            // Lấy ảnh chính (hoặc ảnh đầu tiên)
            List<ProductImage> images = productImageRepository.findByProductIdOrderByDisplayOrderAsc(product.getId());
            String imageUrl = images.stream()
                    .filter(ProductImage::isPrimary)
                    .findFirst()
                    .map(ProductImage::getImageUrl)
                    .orElse(images.isEmpty() ? "" : images.get(0).getImageUrl());

            // Tồn kho: còn hàng nếu có ít nhất 1 chi nhánh ACTIVE có quantity > 0
            List<Inventory> inventories = inventoryRepository.findByProductId(product.getId());
            boolean inStock = product.getStatus() == ActiveStatus.ACTIVE && inventories.stream()
                    .anyMatch(inv -> inv.getBranch() != null && inv.getBranch().getStatus() == ActiveStatus.ACTIVE && inv.getQuantity() > 0);

            CartItemResponse itemDto = new CartItemResponse(
                    item.getId(),
                    product.getId(),
                    product.getName(),
                    product.getSlug(),
                    product.getSku(),
                    imageUrl,
                    priceVnd,
                    item.getQuantity(),
                    subtotal,
                    inStock
            );

            itemResponses.add(itemDto);
            totalItems += item.getQuantity();
            totalPriceVnd += subtotal;
        }

        return new CartResponse(
                cart.getId(),
                itemResponses,
                totalItems,
                itemResponses.size(),
                totalPriceVnd
        );
    }
}
