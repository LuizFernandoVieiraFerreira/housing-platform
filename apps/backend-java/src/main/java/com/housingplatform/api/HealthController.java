package com.housingplatform.api;

import java.util.Map;
import javax.sql.DataSource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("${housing-platform.api-prefix}")
public class HealthController {

  private final DataSource dataSource;

  public HealthController(DataSource dataSource) {
    this.dataSource = dataSource;
  }

  @GetMapping("/health")
  public Map<String, Object> health() {
    boolean databaseOk = checkDatabaseConnection();
    return Map.of(
        "status", databaseOk ? "ok" : "degraded",
        "database", databaseOk);
  }

  private boolean checkDatabaseConnection() {
    try (var connection = dataSource.getConnection();
        var statement = connection.createStatement();
        var resultSet = statement.executeQuery("select 1")) {
      return resultSet.next();
    } catch (Exception ignored) {
      return false;
    }
  }
}
