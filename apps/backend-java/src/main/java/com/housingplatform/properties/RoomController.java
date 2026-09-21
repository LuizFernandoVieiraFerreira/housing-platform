package com.housingplatform.properties;

import com.housingplatform.auth.AuthSupport;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("${housing-platform.api-prefix}/rooms")
public class RoomController {

  private final PropertyService propertyService;

  public RoomController(PropertyService propertyService) {
    this.propertyService = propertyService;
  }

  @DeleteMapping("/{roomId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteRoom(@PathVariable UUID roomId) {
    propertyService.deleteRoom(AuthSupport.requireCurrentUser(), roomId);
  }
}
