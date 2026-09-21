package com.housingplatform.hosts;

import com.housingplatform.auth.AuthSupport;
import com.housingplatform.hosts.dto.HostBooking;
import com.housingplatform.hosts.dto.HostDto;
import com.housingplatform.hosts.dto.HostPropertyListItem;
import com.housingplatform.hosts.dto.RegisterHostRequest;
import com.housingplatform.properties.dto.HostPropertyDetail;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("${housing-platform.api-prefix}/hosts")
public class HostController {

  private final HostService hostService;

  public HostController(HostService hostService) {
    this.hostService = hostService;
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public HostDto registerHost(@Valid @RequestBody RegisterHostRequest request) {
    return hostService.register(AuthSupport.requireCurrentUser(), request);
  }

  @GetMapping("/me")
  public HostDto getCurrentHost() {
    return hostService.getCurrentHost(AuthSupport.requireCurrentUser());
  }

  @GetMapping("/me/properties")
  public List<HostPropertyListItem> listHostProperties() {
    return hostService.listProperties(AuthSupport.requireCurrentUser());
  }

  @GetMapping("/me/properties/{propertyId}")
  public HostPropertyDetail getHostProperty(@PathVariable UUID propertyId) {
    return hostService.getProperty(AuthSupport.requireCurrentUser(), propertyId);
  }

  @GetMapping("/me/bookings")
  public List<HostBooking> listHostBookings() {
    return hostService.listBookings(AuthSupport.requireCurrentUser());
  }
}
