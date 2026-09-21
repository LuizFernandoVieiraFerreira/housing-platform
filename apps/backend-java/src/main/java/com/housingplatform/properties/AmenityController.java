package com.housingplatform.properties;

import com.housingplatform.properties.dto.PropertyAmenityDto;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("${housing-platform.api-prefix}/amenities")
public class AmenityController {

  private final PropertyService propertyService;

  public AmenityController(PropertyService propertyService) {
    this.propertyService = propertyService;
  }

  @GetMapping
  public List<PropertyAmenityDto> listAmenities() {
    return propertyService.listAmenities();
  }
}
