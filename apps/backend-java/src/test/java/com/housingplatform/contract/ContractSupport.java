package com.housingplatform.contract;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import org.yaml.snakeyaml.Yaml;

public final class ContractSupport {

  public static final String API_PREFIX = "/api/v1";

  private static final Pattern PATH_PARAM = Pattern.compile("\\{[^}]+\\}");
  private static final Set<String> HTTP_METHODS =
      Set.of("get", "post", "put", "patch", "delete", "head", "options");

  public static final List<OperationKey> REQUIRED_OPERATIONS =
      List.of(
          operation("/api/v1/properties", "get"),
          operation("/api/v1/properties", "post"),
          operation("/api/v1/properties/{id}", "get"),
          operation("/api/v1/properties/{id}/submit-review", "post"),
          operation("/api/v1/properties/{id}/location", "post"),
          operation("/api/v1/bookings/quote", "get"),
          operation("/api/v1/bookings", "get"),
          operation("/api/v1/bookings", "post"),
          operation("/api/v1/bookings/{id}/cancel", "post"),
          operation("/api/v1/bookings/{id}/approve", "post"),
          operation("/api/v1/bookings/{id}/reject", "post"),
          operation("/api/v1/payments/orders", "post"),
          operation("/api/v1/payments/confirm", "post"),
          operation("/api/v1/payments/webhook", "post"),
          operation("/api/v1/hosts", "post"),
          operation("/api/v1/hosts/me", "get"),
          operation("/api/v1/admin/stats", "get"),
          operation("/api/v1/notifications", "get"),
          operation("/api/v1/notifications/unread-count", "get"),
          operation("/api/v1/profile", "get"),
          operation("/api/v1/profile", "patch"));

  public static OperationKey operation(String path, String method) {
    return new OperationKey(normalizePath(path), method);
  }

  public static final Set<String> CONTRACT_ERROR_CODES =
      Set.of(
          "UNAUTHENTICATED",
          "FORBIDDEN",
          "NOT_FOUND",
          "VALIDATION_ERROR",
          "BOOKING_CONFLICT",
          "BOOKING_EXPIRED",
          "PAYMENT_FAILED",
          "PAYMENT_AMOUNT_MISMATCH",
          "EXTERNAL_SERVICE_ERROR",
          "RATE_LIMITED",
          "INTERNAL_ERROR");

  private ContractSupport() {}

  public record OperationKey(String normalizedPath, String method) {}

  public static Path repoRoot() {
    Path current = Path.of("").toAbsolutePath().normalize();
    while (current != null) {
      if (Files.exists(current.resolve("packages/api-contract/openapi.yaml"))) {
        return current;
      }
      current = current.getParent();
    }
    throw new IllegalStateException("Could not locate packages/api-contract/openapi.yaml");
  }

  public static Path canonicalOpenApiPath() {
    return repoRoot().resolve("packages/api-contract/openapi.yaml");
  }

  @SuppressWarnings("unchecked")
  public static Map<String, Object> loadCanonicalOpenApi() {
    try (InputStream input = Files.newInputStream(canonicalOpenApiPath())) {
      Object document = new Yaml().load(input);
      if (!(document instanceof Map<?, ?> map)) {
        throw new IllegalStateException("Expected OpenAPI document to be a mapping");
      }
      return (Map<String, Object>) map;
    } catch (IOException exception) {
      throw new IllegalStateException("Unable to read canonical OpenAPI document", exception);
    }
  }

  public static String normalizePath(String path) {
    return PATH_PARAM.matcher(path).replaceAll("{}");
  }

  @SuppressWarnings("unchecked")
  public static Map<OperationKey, String> listPathOperations(Map<String, Object> document) {
    Object paths = document.get("paths");
    if (!(paths instanceof Map<?, ?> pathMap)) {
      return Map.of();
    }

    Map<OperationKey, String> operations = new java.util.LinkedHashMap<>();
    for (Map.Entry<?, ?> entry : pathMap.entrySet()) {
      if (!(entry.getKey() instanceof String path) || !(entry.getValue() instanceof Map<?, ?> item)) {
        continue;
      }
      for (Map.Entry<?, ?> methodEntry : item.entrySet()) {
        if (!(methodEntry.getKey() instanceof String method)
            || !HTTP_METHODS.contains(method)
            || !(methodEntry.getValue() instanceof Map<?, ?>)) {
          continue;
        }
        operations.put(new OperationKey(normalizePath(path), method), path);
      }
    }
    return operations;
  }

  @SuppressWarnings("unchecked")
  public static void assertErrorEnvelope(Map<String, Object> body) {
    Object error = body.get("error");
    if (!(error instanceof Map<?, ?> errorMap)) {
      throw new AssertionError("Expected error envelope with 'error' object");
    }

    Set<String> keys = errorMap.keySet().stream().map(Object::toString).collect(java.util.stream.Collectors.toSet());
    if (!keys.isEmpty() && !Set.of("code", "message", "details").containsAll(keys)) {
      throw new AssertionError("Unexpected error keys: " + keys);
    }

    Object code = errorMap.get("code");
    if (!(code instanceof String codeValue) || !CONTRACT_ERROR_CODES.contains(codeValue)) {
      throw new AssertionError("Unexpected error code: " + code);
    }

    Object message = errorMap.get("message");
    if (!(message instanceof String messageValue) || messageValue.isBlank()) {
      throw new AssertionError("Expected non-empty error message");
    }

    Object details = errorMap.get("details");
    if (details != null && !(details instanceof Map<?, ?>)) {
      throw new AssertionError("Expected error details to be an object");
    }
  }
}
