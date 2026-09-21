package com.housingplatform.features.properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.housingplatform.shared.auth.error.BadRequestException;
import com.housingplatform.persistence.enums.AccommodationType;
import com.housingplatform.persistence.repository.PropertyRepository;
import com.housingplatform.persistence.repository.PropertyRepositoryCustom.SearchPropertyRow;
import com.housingplatform.features.properties.dto.PropertySearchQuery;
import com.housingplatform.features.properties.dto.PropertySearchSort;
import com.housingplatform.features.properties.model.PropertySearchCriteria;
import com.housingplatform.shared.StorageUrlResolver;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PropertySearchServiceTest {

  @Mock private PropertyRepository propertyRepository;
  @Mock private StorageUrlResolver storageUrlResolver;

  @InjectMocks private PropertySearchService propertySearchService;

  @Test
  void searchMapsCriteriaAndReturnsTotalCount() {
    UUID propertyId = UUID.randomUUID();
    when(propertyRepository.search(any(), eq(20), eq(0)))
        .thenReturn(
            List.of(
                new SearchPropertyRow(
                    propertyId,
                    "Mapo Studio",
                    "mapo-studio",
                    AccommodationType.STUDIO,
                    "Mapo-gu",
                    "Hongdae",
                    850_000,
                    List.of("modern"),
                    "properties/cover.jpg",
                    "Living room",
                    37.55,
                    126.92,
                    1200.0,
                    1)));
    when(storageUrlResolver.resolvePropertyImageUrl("properties/cover.jpg"))
        .thenReturn("https://cdn.example/cover.jpg");

    var result =
        propertySearchService.search(
            new PropertySearchQuery(
                "mapo",
                AccommodationType.STUDIO,
                null,
                null,
                2,
                700_000,
                1_000_000,
                PropertySearchSort.distance,
                37.55,
                126.92,
                null,
                null,
                null,
                null,
                List.of("washing-machine"),
                10,
                null,
                20,
                0));

    assertThat(result.totalCount()).isEqualTo(1);
    assertThat(result.items()).hasSize(1);
    assertThat(result.items().getFirst().id()).isEqualTo(propertyId);

    ArgumentCaptor<PropertySearchCriteria> captor =
        ArgumentCaptor.forClass(PropertySearchCriteria.class);
    verify(propertyRepository).search(captor.capture(), eq(20), eq(0));
    PropertySearchCriteria criteria = captor.getValue();
    assertThat(criteria.textQuery()).isEqualTo("mapo");
    assertThat(criteria.propertyType()).isEqualTo(AccommodationType.STUDIO);
    assertThat(criteria.guests()).isEqualTo(2);
    assertThat(criteria.sort()).isEqualTo(PropertySearchSort.distance);
    assertThat(criteria.amenitySlugs()).containsExactly("washing-machine");
    assertThat(criteria.maxStationWalkMin()).isEqualTo(10);
  }

  @Test
  void searchRejectsInvalidPriceRange() {
    assertThatThrownBy(
            () ->
                propertySearchService.search(
                    new PropertySearchQuery(
                        null,
                        null,
                        null,
                        null,
                        null,
                        900_000,
                        700_000,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        20,
                        0)))
        .isInstanceOf(BadRequestException.class);
  }

  @Test
  void toCriteriaComputesStayNightsAndBounds() {
    PropertySearchCriteria criteria =
        PropertySearchService.toCriteria(
            new PropertySearchQuery(
                null,
                null,
                LocalDate.of(2026, 6, 1),
                LocalDate.of(2026, 6, 8),
                null,
                null,
                null,
                PropertySearchSort.recommended,
                null,
                null,
                38.0,
                37.0,
                127.0,
                126.0,
                null,
                null,
                null,
                20,
                0));

    assertThat(criteria.stayNights()).isEqualTo(7);
    assertThat(criteria.hasBounds()).isTrue();
  }
}
