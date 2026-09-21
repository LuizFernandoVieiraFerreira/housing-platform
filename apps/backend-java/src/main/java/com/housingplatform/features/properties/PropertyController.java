package com.housingplatform.features.properties;

import com.housingplatform.shared.auth.AuthSupport;
import com.housingplatform.features.properties.dto.CreateRoomRequest;
import com.housingplatform.features.properties.dto.CreatedId;
import com.housingplatform.features.properties.dto.HostPropertyDetail;
import com.housingplatform.features.properties.dto.HostPropertyRequest;
import com.housingplatform.features.properties.dto.HostRoomDto;
import com.housingplatform.features.properties.dto.PropertyDetail;
import com.housingplatform.features.properties.dto.PropertySearchQuery;
import com.housingplatform.features.properties.dto.PropertySearchResult;
import com.housingplatform.features.properties.dto.PropertyStatusChange;
import com.housingplatform.features.properties.dto.SetPropertyLocationRequest;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("${housing-platform.api-prefix}/properties")
public class PropertyController {

  private final PropertyService propertyService;

  public PropertyController(PropertyService propertyService) {
    this.propertyService = propertyService;
  }

  @GetMapping
  public PropertySearchResult searchProperties(@Valid @ModelAttribute PropertySearchQuery query) {
    return propertyService.search(query);
  }

  @GetMapping("/{propertyId}")
  public PropertyDetail getProperty(@PathVariable UUID propertyId) {
    return propertyService.getPublishedProperty(propertyId);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public CreatedId createProperty(@Valid @RequestBody HostPropertyRequest request) {
    return propertyService.createProperty(AuthSupport.requireCurrentUser(), request);
  }

  @PatchMapping("/{propertyId}")
  public HostPropertyDetail updateProperty(
      @PathVariable UUID propertyId, @Valid @RequestBody HostPropertyRequest request) {
    return propertyService.updateProperty(AuthSupport.requireCurrentUser(), propertyId, request);
  }

  @PostMapping("/{propertyId}/submit-review")
  public PropertyStatusChange submitPropertyForReview(@PathVariable UUID propertyId) {
    return propertyService.submitForReview(AuthSupport.requireCurrentUser(), propertyId);
  }

  @PostMapping("/{propertyId}/location")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void setPropertyLocation(
      @PathVariable UUID propertyId, @Valid @RequestBody SetPropertyLocationRequest request) {
    propertyService.setLocation(AuthSupport.requireCurrentUser(), propertyId, request);
  }

  @PostMapping("/{propertyId}/rooms")
  @ResponseStatus(HttpStatus.CREATED)
  public HostRoomDto createRoom(
      @PathVariable UUID propertyId, @Valid @RequestBody CreateRoomRequest request) {
    return propertyService.createRoom(AuthSupport.requireCurrentUser(), propertyId, request);
  }
}
