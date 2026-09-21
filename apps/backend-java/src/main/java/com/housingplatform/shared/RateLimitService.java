package com.housingplatform.shared;

import com.housingplatform.auth.error.RateLimitedException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.hibernate.exception.GenericJDBCException;
import org.springframework.stereotype.Service;

@Service
public class RateLimitService {

  @PersistenceContext private EntityManager entityManager;

  public void assertRateLimit(String bucket, int maxRequests, int windowSeconds) {
    try {
      entityManager
          .createNativeQuery(
              "select public.assert_rate_limit(:bucket, :maxRequests, :windowSeconds)")
          .setParameter("bucket", bucket)
          .setParameter("maxRequests", maxRequests)
          .setParameter("windowSeconds", windowSeconds)
          .getSingleResult();
    } catch (RuntimeException exception) {
      if (isRateLimitError(exception)) {
        throw new RateLimitedException("Rate limit exceeded");
      }
      throw exception;
    }
  }

  private static boolean isRateLimitError(Throwable exception) {
    Throwable current = exception;
    while (current != null) {
      String message = current.getMessage();
      if (message != null && message.toLowerCase().contains("rate limit exceeded")) {
        return true;
      }
      if (current instanceof GenericJDBCException generic
          && generic.getSQLException() != null
          && generic.getSQLException().getMessage().toLowerCase().contains("rate limit exceeded")) {
        return true;
      }
      current = current.getCause();
    }
    return false;
  }
}
