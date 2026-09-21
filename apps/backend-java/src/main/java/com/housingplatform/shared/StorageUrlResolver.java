package com.housingplatform.shared;

import com.housingplatform.config.AppProperties;
import org.springframework.stereotype.Component;

@Component
public class StorageUrlResolver {

  private static final String PROPERTY_IMAGES_BUCKET = "property-images";

  private final AppProperties appProperties;

  public StorageUrlResolver(AppProperties appProperties) {
    this.appProperties = appProperties;
  }

  public String resolvePropertyImageUrl(String storagePath) {
    if (storagePath == null || storagePath.isBlank()) {
      return null;
    }
    if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
      return storagePath;
    }
    String base = appProperties.supabaseUrl().replaceAll("/+$", "");
    String path = storagePath.replaceAll("^/+", "");
    return base + "/storage/v1/object/public/" + PROPERTY_IMAGES_BUCKET + "/" + path;
  }
}
