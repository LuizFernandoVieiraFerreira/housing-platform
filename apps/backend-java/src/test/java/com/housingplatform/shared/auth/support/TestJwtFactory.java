package com.housingplatform.shared.auth.support;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

public final class TestJwtFactory {

  public static final String JWT_SECRET =
      "super-secret-jwt-token-with-at-least-32-characters-long";
  public static final String SUPABASE_URL = "http://127.0.0.1:54321";
  public static final String ISSUER = SUPABASE_URL + "/auth/v1";

  private TestJwtFactory() {}

  public static String buildToken(
      UUID userId, String role, boolean expired, String audience, String secret)
      throws Exception {
    Instant now = Instant.now();
    Instant expiration =
        expired ? now.minus(10, ChronoUnit.SECONDS) : now.plus(1, ChronoUnit.HOURS);

    JWTClaimsSet claims =
        new JWTClaimsSet.Builder()
            .subject(userId.toString())
            .claim("role", role)
            .audience(audience)
            .issuer(ISSUER)
            .issueTime(Date.from(now))
            .expirationTime(Date.from(expiration))
            .claim("email", "test@example.com")
            .build();

    SignedJWT signedJwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
    signedJwt.sign(new MACSigner(secret.getBytes(StandardCharsets.UTF_8)));
    return signedJwt.serialize();
  }

  public static String buildToken(UUID userId) throws Exception {
    return buildToken(userId, "authenticated", false, "authenticated", JWT_SECRET);
  }
}
