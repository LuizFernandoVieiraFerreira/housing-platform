package com.housingplatform.auth.jwt;

import com.housingplatform.auth.error.UnauthenticatedException;
import com.housingplatform.auth.model.JwtClaims;
import com.housingplatform.config.AppProperties;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.jwk.source.RemoteJWKSet;
import com.nimbusds.jose.proc.BadJOSEException;
import com.nimbusds.jose.proc.JWSKeySelector;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.nimbusds.jwt.proc.ConfigurableJWTProcessor;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import java.net.URL;
import java.text.ParseException;
import java.util.Date;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class SupabaseJwtValidator {

  private static final Set<JWSAlgorithm> JWKS_ALGORITHMS =
      Set.of(JWSAlgorithm.RS256, JWSAlgorithm.ES256);

  private final String audience;
  private final String issuer;
  private final String jwtSecret;
  private final ConfigurableJWTProcessor<SecurityContext> jwksProcessor;

  public SupabaseJwtValidator(AppProperties appProperties) {
    this.audience = appProperties.supabaseJwtAudience();
    this.jwtSecret = normalizeSecret(appProperties.supabaseJwtSecret());
    this.issuer = buildIssuer(appProperties.supabaseUrl());

    try {
      URL jwksUrl = new URL(issuer + "/.well-known/jwks.json");
      JWKSource<SecurityContext> jwkSource = new RemoteJWKSet<>(jwksUrl);
      JWSKeySelector<SecurityContext> keySelector =
          new JWSVerificationKeySelector<>(JWKS_ALGORITHMS, jwkSource);
      DefaultJWTProcessor<SecurityContext> processor = new DefaultJWTProcessor<>();
      processor.setJWSKeySelector(keySelector);
      this.jwksProcessor = processor;
    } catch (Exception exception) {
      throw new IllegalStateException("Unable to initialize Supabase JWKS client", exception);
    }
  }

  public JwtClaims validate(String token) {
    try {
      SignedJWT signedJwt = SignedJWT.parse(token);
      JWSAlgorithm algorithm = signedJwt.getHeader().getAlgorithm();
      JWTClaimsSet claims =
          JWSAlgorithm.HS256.equals(algorithm) ? decodeHs256(signedJwt) : decodeViaJwks(signedJwt);

      validateAuthenticatedRole(claims);
      UUID userId = parseSubject(claims);
      String email = claims.getStringClaim("email");
      return new JwtClaims(userId, email);
    } catch (UnauthenticatedException exception) {
      throw exception;
    } catch (Exception exception) {
      throw new UnauthenticatedException("Invalid or expired access token");
    }
  }

  private JWTClaimsSet decodeHs256(SignedJWT signedJwt)
      throws JOSEException, ParseException, BadJOSEException {
    if (jwtSecret == null) {
      throw new UnauthenticatedException("Invalid or expired access token");
    }

    JWSVerifier verifier = new MACVerifier(jwtSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    if (!signedJwt.verify(verifier)) {
      throw new UnauthenticatedException("Invalid or expired access token");
    }

    JWTClaimsSet claims = signedJwt.getJWTClaimsSet();
    validateStandardClaims(claims, true);
    return claims;
  }

  private JWTClaimsSet decodeViaJwks(SignedJWT signedJwt)
      throws BadJOSEException, ParseException, JOSEException {
    JWTClaimsSet claims = jwksProcessor.process(signedJwt, null);
    validateStandardClaims(claims, false);
    return claims;
  }

  private void validateStandardClaims(JWTClaimsSet claims, boolean validateIssuer)
      throws ParseException {
    Date expiration = claims.getExpirationTime();
    if (expiration == null || !expiration.after(new Date())) {
      throw new UnauthenticatedException("Invalid or expired access token");
    }

    if (claims.getSubject() == null || claims.getSubject().isBlank()) {
      throw new UnauthenticatedException("Access token is missing a valid subject");
    }

    if (!hasAudience(claims, audience)) {
      throw new UnauthenticatedException("Invalid or expired access token");
    }

    if (validateIssuer && !issuer.equals(claims.getIssuer())) {
      throw new UnauthenticatedException("Invalid or expired access token");
    }
  }

  private static void validateAuthenticatedRole(JWTClaimsSet claims) throws ParseException {
    Object role = claims.getClaim("role");
    if (!"authenticated".equals(role)) {
      throw new UnauthenticatedException("Access token is not for an authenticated user");
    }
  }

  private static UUID parseSubject(JWTClaimsSet claims) {
    try {
      return UUID.fromString(claims.getSubject());
    } catch (IllegalArgumentException exception) {
      throw new UnauthenticatedException("Access token is missing a valid subject");
    }
  }

  private static boolean hasAudience(JWTClaimsSet claims, String expectedAudience)
      throws ParseException {
    return claims.getAudience() != null && claims.getAudience().contains(expectedAudience);
  }

  private static String buildIssuer(String supabaseUrl) {
    return supabaseUrl.replaceAll("/+$", "") + "/auth/v1";
  }

  private static String normalizeSecret(String secret) {
    if (secret == null || secret.isBlank()) {
      return null;
    }
    return secret.trim();
  }
}
