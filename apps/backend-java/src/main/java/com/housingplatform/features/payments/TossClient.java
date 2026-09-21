package com.housingplatform.features.payments;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.housingplatform.config.AppProperties;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Component
public class TossClient {

  private static final String TOSS_API_BASE = "https://api.tosspayments.com/v1";

  private final AppProperties appProperties;
  private final RestClient http;
  private final ObjectMapper objectMapper;

  public TossClient(AppProperties appProperties, ObjectMapper objectMapper) {
    this.appProperties = appProperties;
    this.objectMapper = objectMapper;
    this.http = RestClient.builder().baseUrl(TOSS_API_BASE).build();
  }

  public boolean isDevMockEnabled() {
    return appProperties.paymentDevMock() || secretKey().isEmpty();
  }

  public boolean hasSecretKey() {
    return !secretKey().isEmpty();
  }

  @SuppressWarnings("unchecked")
  public Map<String, Object> confirmPayment(String paymentKey, String orderId, int amount) {
    if (isDevMockEnabled() && paymentKey.startsWith("devmock_")) {
      Map<String, Object> payload = new LinkedHashMap<>();
      payload.put("status", "DONE");
      payload.put("paymentKey", paymentKey);
      payload.put("orderId", orderId);
      payload.put("totalAmount", amount);
      payload.put("method", "DEV_MOCK");
      return payload;
    }

    try {
      return http.post()
          .uri("/payments/confirm")
          .header(HttpHeaders.AUTHORIZATION, authHeader())
          .contentType(MediaType.APPLICATION_JSON)
          .body(Map.of("paymentKey", paymentKey, "orderId", orderId, "amount", amount))
          .retrieve()
          .body(Map.class);
    } catch (RestClientResponseException exception) {
      String message = extractMessage(exception);
      throw new TossClientError(message);
    }
  }

  @SuppressWarnings("unchecked")
  public Map<String, Object> fetchPayment(String paymentKey) {
    try {
      return http.get()
          .uri("/payments/{paymentKey}", paymentKey)
          .header(HttpHeaders.AUTHORIZATION, authHeader())
          .retrieve()
          .body(Map.class);
    } catch (RestClientResponseException exception) {
      String message = extractMessage(exception);
      throw new TossClientError(message);
    }
  }

  public static boolean isSuccessful(Map<String, Object> payload) {
    return "DONE".equals(String.valueOf(payload.get("status")));
  }

  public static boolean isFailed(Map<String, Object> payload) {
    String status = String.valueOf(payload.get("status"));
    return "ABORTED".equals(status) || "CANCELED".equals(status) || "EXPIRED".equals(status);
  }

  private String authHeader() {
    if (secretKey().isEmpty()) {
      throw new TossClientError("TOSS_SECRET_KEY is not configured");
    }
    String encoded =
        Base64.getEncoder()
            .encodeToString((secretKey() + ":").getBytes(StandardCharsets.UTF_8));
    return "Basic " + encoded;
  }

  private String secretKey() {
    String key = appProperties.tossSecretKey();
    return key == null ? "" : key;
  }

  @SuppressWarnings("unchecked")
  private String extractMessage(RestClientResponseException exception) {
    try {
      Map<String, Object> payload = objectMapper.readValue(exception.getResponseBodyAsString(), Map.class);
      Object message = payload.get("message");
      if (message != null) {
        return message.toString();
      }
    } catch (Exception ignored) {
      // fall through
    }
    return exception.getMessage();
  }

  public static class TossClientError extends RuntimeException {
    public TossClientError(String message) {
      super(message);
    }
  }
}
