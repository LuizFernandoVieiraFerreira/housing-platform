package com.housingplatform.api;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import com.housingplatform.auth.jwt.SupabaseJwtValidator;
import com.housingplatform.auth.service.AuthorizationService;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(
    controllers = HealthController.class,
    excludeAutoConfiguration = {
      DataSourceAutoConfiguration.class,
      HibernateJpaAutoConfiguration.class,
      SecurityAutoConfiguration.class
    })
@TestPropertySource(properties = "housing-platform.api-prefix=/api/v1")
@AutoConfigureMockMvc(addFilters = false)
class HealthControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private DataSource dataSource;

  @MockitoBean private SupabaseJwtValidator supabaseJwtValidator;

  @MockitoBean private AuthorizationService authorizationService;

  @Test
  void healthEndpointReturnsOkWhenDatabaseIsReachable() throws Exception {
    Connection connection = mock(Connection.class);
    Statement statement = mock(Statement.class);
    ResultSet resultSet = mock(ResultSet.class);

    when(dataSource.getConnection()).thenReturn(connection);
    when(connection.createStatement()).thenReturn(statement);
    when(statement.executeQuery("select 1")).thenReturn(resultSet);
    when(resultSet.next()).thenReturn(true);

    mockMvc
        .perform(get("/api/v1/health"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("ok"))
        .andExpect(jsonPath("$.database").value(true));
  }

  @Test
  void healthEndpointReturnsDegradedWhenDatabaseFails() throws Exception {
    when(dataSource.getConnection()).thenThrow(new RuntimeException("connection refused"));

    mockMvc
        .perform(get("/api/v1/health"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("degraded"))
        .andExpect(jsonPath("$.database").value(false));
  }
}
