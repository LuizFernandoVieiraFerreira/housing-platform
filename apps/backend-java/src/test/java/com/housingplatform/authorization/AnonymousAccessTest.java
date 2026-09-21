package com.housingplatform.authorization;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.housingplatform.admin.AdminController;
import com.housingplatform.admin.AdminService;
import com.housingplatform.api.error.GlobalExceptionHandler;
import com.housingplatform.auth.jwt.SupabaseJwtValidator;
import com.housingplatform.auth.security.SecurityConfig;
import com.housingplatform.auth.security.SupabaseJwtAuthenticationFilter;
import com.housingplatform.auth.service.AuthorizationService;
import com.housingplatform.auth.support.TestJwtFactory;
import com.housingplatform.config.AppProperties;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

@WebMvcTest(
    controllers = AdminController.class,
    excludeAutoConfiguration = {
      DataSourceAutoConfiguration.class,
      HibernateJpaAutoConfiguration.class
    })
@Import({
  AdminService.class,
  SecurityConfig.class,
  SupabaseJwtAuthenticationFilter.class,
  SupabaseJwtValidator.class,
  GlobalExceptionHandler.class
})
@EnableConfigurationProperties(AppProperties.class)
@TestPropertySource(
    properties = {
      "housing-platform.api-prefix=/api/v1",
      "housing-platform.supabase-url=" + TestJwtFactory.SUPABASE_URL,
      "housing-platform.supabase-jwt-secret=" + TestJwtFactory.JWT_SECRET,
      "housing-platform.supabase-jwt-audience=authenticated"
    })
class AnonymousAccessTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private com.housingplatform.admin.AdminRepository adminRepository;

  @MockitoBean private AuthorizationService authorizationService;

  @ParameterizedTest
  @MethodSource("adminRoutes")
  void adminRoutesRequireAuthentication(AdminRoute route) throws Exception {
    MockHttpServletRequestBuilder request =
        switch (route.method()) {
          case "get" -> get(route.path());
          case "post" -> post(route.path());
          case "patch" ->
              patch(route.path())
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("{\"status\":\"closed\"}");
          default -> throw new IllegalArgumentException("Unsupported method: " + route.method());
        };

    mockMvc
        .perform(request)
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error.code").value("UNAUTHENTICATED"));
  }

  static Stream<AdminRoute> adminRoutes() {
    UUID id = UUID.randomUUID();
    return Stream.of(
        new AdminRoute("get", AuthorizationMvcTestSupport.API + "/admin/stats"),
        new AdminRoute("get", AuthorizationMvcTestSupport.API + "/admin/properties"),
        new AdminRoute("post", AuthorizationMvcTestSupport.API + "/admin/properties/" + id + "/publish"),
        new AdminRoute("post", AuthorizationMvcTestSupport.API + "/admin/properties/" + id + "/reject"),
        new AdminRoute("post", AuthorizationMvcTestSupport.API + "/admin/hosts/" + id + "/approve"),
        new AdminRoute("get", AuthorizationMvcTestSupport.API + "/admin/audit-logs"),
        new AdminRoute("patch", AuthorizationMvcTestSupport.API + "/admin/housing-requests/" + id));
  }

  record AdminRoute(String method, String path) {}
}
