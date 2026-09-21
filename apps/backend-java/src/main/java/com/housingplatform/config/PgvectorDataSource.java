package com.housingplatform.config;

import com.pgvector.PGvector;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.util.logging.Logger;
import javax.sql.DataSource;

final class PgvectorDataSource implements DataSource {

  private final DataSource delegate;

  PgvectorDataSource(DataSource delegate) {
    this.delegate = delegate;
  }

  @Override
  public Connection getConnection() throws SQLException {
    return registerPgvectorTypes(delegate.getConnection());
  }

  @Override
  public Connection getConnection(String username, String password) throws SQLException {
    // HikariCP and most pools configure credentials once and reject per-call overrides.
    return getConnection();
  }

  private static Connection registerPgvectorTypes(Connection connection) throws SQLException {
    PGvector.registerTypes(connection);
    return connection;
  }

  @Override
  public PrintWriter getLogWriter() throws SQLException {
    return delegate.getLogWriter();
  }

  @Override
  public void setLogWriter(PrintWriter out) throws SQLException {
    delegate.setLogWriter(out);
  }

  @Override
  public void setLoginTimeout(int seconds) throws SQLException {
    delegate.setLoginTimeout(seconds);
  }

  @Override
  public int getLoginTimeout() throws SQLException {
    return delegate.getLoginTimeout();
  }

  @Override
  public Logger getParentLogger() throws SQLFeatureNotSupportedException {
    return delegate.getParentLogger();
  }

  @Override
  public <T> T unwrap(Class<T> iface) throws SQLException {
    if (iface.isInstance(delegate)) {
      return iface.cast(delegate);
    }
    return delegate.unwrap(iface);
  }

  @Override
  public boolean isWrapperFor(Class<?> iface) throws SQLException {
    return iface.isInstance(delegate) || delegate.isWrapperFor(iface);
  }
}
