package com.techstore.product.service;

import com.techstore.product.dto.BrandDto;
import com.techstore.product.entity.ActiveStatus;
import com.techstore.product.repository.BrandRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class BrandServiceImpl implements BrandService {

    private final BrandRepository brandRepository;

    public BrandServiceImpl(BrandRepository brandRepository) {
        this.brandRepository = brandRepository;
    }

    @Override
    public List<BrandDto> getActiveBrands() {
        return brandRepository.findByStatusOrderByNameAsc(ActiveStatus.ACTIVE).stream()
                .map(b -> new BrandDto(b.getId(), b.getName(), b.getSlug(), b.getLogoUrl()))
                .toList();
    }
}
