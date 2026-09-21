package com.housingplatform;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@Tag("integration")
class ApplicationContextIntegrationTest {

  @Test
  void contextLoadsWithValidatedSchema() {
    // Bootstrapping validates JPA entities against the migrated Supabase schema.
  }
}
