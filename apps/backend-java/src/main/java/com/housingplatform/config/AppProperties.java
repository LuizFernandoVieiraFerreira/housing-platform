package com.housingplatform.config;

import java.util.Arrays;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "housing-platform")
public record AppProperties(
    String apiPrefix,
    String corsOrigins,
    String supabaseUrl,
    String supabaseJwtSecret,
    String supabaseJwtAudience,
    String tossSecretKey,
    boolean paymentDevMock) {

  public List<String> corsOriginList() {
    if (corsOrigins == null || corsOrigins.isBlank()) {
      return List.of();
    }

    return Arrays.stream(corsOrigins.split(","))
        .map(String::trim)
        .filter(origin -> !origin.isEmpty())
        .toList();
  }
}
