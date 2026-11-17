package com.techstore.checkout.service;

import com.techstore.checkout.dto.CheckoutRequest;
import com.techstore.checkout.dto.CheckoutResponse;

public interface CheckoutService {
    CheckoutResponse checkout(Long userId, CheckoutRequest request);
}
