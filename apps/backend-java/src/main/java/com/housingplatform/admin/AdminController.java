package com.housingplatform.admin;

import com.housingplatform.auth.AuthSupport;
import com.housingplatform.admin.dto.AdminDashboardStats;
import com.housingplatform.admin.dto.AdminHost;
import com.housingplatform.admin.dto.AdminPayment;
import com.housingplatform.admin.dto.AdminProperty;
import com.housingplatform.admin.dto.AuditLogDto;
import com.housingplatform.admin.dto.HousingRequestDto;
import com.housingplatform.admin.dto.UpdateHousingRequestStatusRequest;
import com.housingplatform.hosts.dto.HostBooking;
import com.housingplatform.hosts.dto.HostDto;
import com.housingplatform.properties.dto.PropertyStatusChange;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("${housing-platform.api-prefix}/admin")
public class AdminController {

  private final AdminService adminService;

  public AdminController(AdminService adminService) {
    this.adminService = adminService;
  }

  @GetMapping("/stats")
  public AdminDashboardStats getAdminStats() {
    return adminService.getDashboardStats(AuthSupport.requireCurrentUser());
  }

  @GetMapping("/properties")
  public List<AdminProperty> listAdminProperties() {
    return adminService.listProperties(AuthSupport.requireCurrentUser());
  }

  @PostMapping("/properties/{propertyId}/publish")
  public PropertyStatusChange publishProperty(@PathVariable UUID propertyId) {
    return adminService.publishProperty(AuthSupport.requireCurrentUser(), propertyId);
  }

  @PostMapping("/properties/{propertyId}/reject")
  public PropertyStatusChange rejectPropertyReview(@PathVariable UUID propertyId) {
    return adminService.rejectPropertyReview(AuthSupport.requireCurrentUser(), propertyId);
  }

  @GetMapping("/hosts")
  public List<AdminHost> listAdminHosts() {
    return adminService.listHosts(AuthSupport.requireCurrentUser());
  }

  @PostMapping("/hosts/{hostId}/approve")
  public HostDto approveHost(@PathVariable UUID hostId) {
    return adminService.approveHost(AuthSupport.requireCurrentUser(), hostId);
  }

  @GetMapping("/bookings")
  public List<HostBooking> listAdminBookings() {
    return adminService.listBookings(AuthSupport.requireCurrentUser());
  }

  @GetMapping("/payments")
  public List<AdminPayment> listAdminPayments() {
    return adminService.listPayments(AuthSupport.requireCurrentUser());
  }

  @GetMapping("/housing-requests")
  public List<HousingRequestDto> listHousingRequests() {
    return adminService.listHousingRequests(AuthSupport.requireCurrentUser());
  }

  @PatchMapping("/housing-requests/{requestId}")
  public HousingRequestDto updateHousingRequestStatus(
      @PathVariable UUID requestId, @Valid @RequestBody UpdateHousingRequestStatusRequest request) {
    return adminService.updateHousingRequestStatus(
        AuthSupport.requireCurrentUser(), requestId, request);
  }

  @GetMapping("/audit-logs")
  public List<AuditLogDto> listAuditLogs() {
    return adminService.listAuditLogs(AuthSupport.requireCurrentUser());
  }
}
