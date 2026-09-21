package com.housingplatform.features.properties;

import com.housingplatform.shared.auth.error.BadRequestException;
import com.housingplatform.persistence.repository.PropertyRepository;
import com.housingplatform.persistence.repository.PropertyRepositoryCustom.SearchPropertyRow;
import com.housingplatform.features.properties.dto.PropertySearchQuery;
import com.housingplatform.features.properties.dto.PropertySearchResult;
import com.housingplatform.features.properties.dto.PropertySearchSort;
import com.housingplatform.features.properties.mapper.PropertyMapper;
import com.housingplatform.features.properties.model.PropertySearchCriteria;
import com.housingplatform.shared.StorageUrlResolver;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PropertySearchService {

  private final PropertyRepository propertyRepository;
  private final StorageUrlResolver storageUrlResolver;

  public PropertySearchService(
      PropertyRepository propertyRepository, StorageUrlResolver storageUrlResolver) {
    this.propertyRepository = propertyRepository;
    this.storageUrlResolver = storageUrlResolver;
  }

  @Transactional(readOnly = true)
  public PropertySearchResult search(PropertySearchQuery query) {
    validateSearchQuery(query);
    PropertySearchCriteria criteria = toCriteria(query);
    List<SearchPropertyRow> rows =
        propertyRepository.search(criteria, query.limit(), query.offset());
    int totalCount = rows.isEmpty() ? 0 : rows.getFirst().totalCount();
    var items = rows.stream().map(row -> PropertyMapper.toSearchCard(row, storageUrlResolver)).toList();
    return new PropertySearchResult(items, totalCount);
  }

  static PropertySearchCriteria toCriteria(PropertySearchQuery query) {
    Integer stayNights = null;
    if (query.checkIn() != null && query.checkOut() != null) {
      stayNights = (int) query.checkIn().datesUntil(query.checkOut()).count();
    }

    boolean hasBounds =
        query.north() != null
            && query.south() != null
            && query.east() != null
            && query.west() != null;

    String textQuery =
        query.query() == null || query.query().isBlank() ? null : query.query().strip();

    PropertySearchSort sort = query.sort() == null ? PropertySearchSort.recommended : query.sort();

    return new PropertySearchCriteria(
        textQuery,
        query.propertyType(),
        query.priceMin(),
        query.priceMax(),
        query.guests(),
        stayNights,
        query.checkIn(),
        sort,
        query.centerLat(),
        query.centerLng(),
        query.north(),
        query.south(),
        query.east(),
        query.west(),
        hasBounds,
        query.maxStationWalkMin(),
        query.amenitySlugs() == null || query.amenitySlugs().isEmpty()
            ? null
            : query.amenitySlugs(),
        query.excludePropertyIds() == null || query.excludePropertyIds().isEmpty()
            ? null
            : query.excludePropertyIds());
  }

  private static void validateSearchQuery(PropertySearchQuery query) {
    if (query.priceMin() != null
        && query.priceMax() != null
        && query.priceMax() < query.priceMin()) {
      throw new BadRequestException("priceMax must be greater than or equal to priceMin");
    }
    if (query.checkIn() != null
        && query.checkOut() != null
        && !query.checkOut().isAfter(query.checkIn())) {
      throw new BadRequestException("checkOut must be after checkIn");
    }
    if (query.maxStationWalkMin() != null && query.maxStationWalkMin() <= 0) {
      throw new BadRequestException("maxStationWalkMin must be greater than 0");
    }
  }
}
