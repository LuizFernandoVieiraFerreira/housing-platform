package com.housingplatform.admin;

import com.housingplatform.persistence.repository.AdminRepositoryCustom;
import com.housingplatform.admin.dto.AdminDashboardStats;
import com.housingplatform.admin.dto.AdminHost;
import com.housingplatform.admin.dto.AdminPayment;
import com.housingplatform.admin.dto.AdminProperty;
import com.housingplatform.admin.dto.AuditLogDto;
import com.housingplatform.admin.dto.HousingRequestDto;
import com.housingplatform.admin.dto.UpdateHousingRequestStatusRequest;
import com.housingplatform.admin.mapper.AdminMapper;
import com.housingplatform.auth.error.BadRequestException;
import com.housingplatform.auth.error.NotFoundException;
import com.housingplatform.auth.model.AuthenticatedUser;
import com.housingplatform.auth.service.AuthorizationService;
import com.housingplatform.hosts.dto.HostBooking;
import com.housingplatform.hosts.dto.HostDto;
import com.housingplatform.hosts.mapper.HostMapper;
import com.housingplatform.properties.dto.PropertyStatusChange;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminService {

  private final AdminRepositoryCustom adminRepository;
  private final AuthorizationService authorizationService;

  public AdminService(
      AdminRepositoryCustom adminRepository, AuthorizationService authorizationService) {
    this.adminRepository = adminRepository;
    this.authorizationService = authorizationService;
  }

  @Transactional(readOnly = true)
  public AdminDashboardStats getDashboardStats(AuthenticatedUser user) {
    authorizationService.requireAdmin(user);
    Map<String, Integer> stats = adminRepository.getDashboardStats();
    return new AdminDashboardStats(
        stats.get("pendingProperties"),
        stats.get("pendingHosts"),
        stats.get("openBookings"),
        stats.get("openHousingRequests"));
  }

  @Transactional(readOnly = true)
  public List<AdminProperty> listProperties(AuthenticatedUser user) {
    authorizationService.requireAdmin(user);
    return adminRepository.listProperties().stream().map(AdminMapper::toAdminProperty).toList();
  }

  @Transactional
  public PropertyStatusChange publishProperty(AuthenticatedUser user, UUID propertyId) {
    authorizationService.requireAdmin(user);
    var property = adminRepository.publishProperty(propertyId);
    if (property == null) {
      throw new BadRequestException("Property must be pending review before it can be published");
    }

    adminRepository.writeAuditLog(
        user.id(),
        "property.published",
        "property",
        property.getId(),
        Map.of("title", property.getTitle(), "slug", property.getSlug()));

    return AdminMapper.toPropertyStatusChange(property.getId(), property.getStatus());
  }

  @Transactional
  public PropertyStatusChange rejectPropertyReview(AuthenticatedUser user, UUID propertyId) {
    authorizationService.requireAdmin(user);
    var property = adminRepository.rejectPropertyReview(propertyId);
    if (property == null) {
      throw new BadRequestException("Property must be pending review before it can be rejected");
    }

    adminRepository.writeAuditLog(
        user.id(),
        "property.review_rejected",
        "property",
        property.getId(),
        Map.of("title", property.getTitle(), "slug", property.getSlug()));

    return AdminMapper.toPropertyStatusChange(property.getId(), property.getStatus());
  }

  @Transactional(readOnly = true)
  public List<AdminHost> listHosts(AuthenticatedUser user) {
    authorizationService.requireAdmin(user);
    return adminRepository.listHosts().stream().map(AdminMapper::toAdminHost).toList();
  }

  @Transactional
  public HostDto approveHost(AuthenticatedUser user, UUID hostId) {
    authorizationService.requireAdmin(user);
    var host = adminRepository.approveHost(hostId);
    if (host == null) {
      throw new BadRequestException("Host must be pending before it can be approved");
    }

    adminRepository.writeAuditLog(
        user.id(),
        "host.approved",
        "host",
        host.getId(),
        Map.of("display_name", host.getDisplayName()));

    return HostMapper.toDto(host);
  }

  @Transactional(readOnly = true)
  public List<HostBooking> listBookings(AuthenticatedUser user) {
    authorizationService.requireAdmin(user);
    return adminRepository.listBookings().stream()
        .map(
            row ->
                new HostBooking(
                    row.id(),
                    row.status(),
                    row.bookingType(),
                    row.checkIn(),
                    row.checkOut(),
                    row.guestCount(),
                    row.customerNotes(),
                    row.propertyTitle(),
                    row.roomName(),
                    row.totalKrw(),
                    row.createdAt()))
        .toList();
  }

  @Transactional(readOnly = true)
  public List<AdminPayment> listPayments(AuthenticatedUser user) {
    authorizationService.requireAdmin(user);
    return adminRepository.listPayments().stream().map(AdminMapper::toAdminPayment).toList();
  }

  @Transactional(readOnly = true)
  public List<HousingRequestDto> listHousingRequests(AuthenticatedUser user) {
    authorizationService.requireAdmin(user);
    return adminRepository.listHousingRequests().stream()
        .map(AdminMapper::toHousingRequest)
        .toList();
  }

  @Transactional
  public HousingRequestDto updateHousingRequestStatus(
      AuthenticatedUser user, UUID requestId, UpdateHousingRequestStatusRequest request) {
    authorizationService.requireAdmin(user);
    var updated = adminRepository.updateHousingRequestStatus(requestId, request.status());
    if (updated == null) {
      throw new NotFoundException("Housing request not found");
    }

    adminRepository.writeAuditLog(
        user.id(),
        "housing_request.status_updated",
        "housing_request",
        updated.getId(),
        Map.of("status", updated.getStatus().dbValue()));

    return AdminMapper.toHousingRequest(updated);
  }

  @Transactional(readOnly = true)
  public List<AuditLogDto> listAuditLogs(AuthenticatedUser user) {
    authorizationService.requireAdmin(user);
    return adminRepository.listAuditLogs().stream().map(AdminMapper::toAuditLog).toList();
  }
}
