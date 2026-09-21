package com.housingplatform.shared.auth.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.housingplatform.api.error.ApiErrorResponse;
import com.housingplatform.shared.auth.error.UnauthenticatedException;
import com.housingplatform.shared.auth.jwt.SupabaseJwtValidator;
import com.housingplatform.shared.auth.model.AuthenticatedUser;
import com.housingplatform.shared.auth.model.JwtClaims;
import com.housingplatform.shared.auth.service.AuthorizationService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class SupabaseJwtAuthenticationFilter extends OncePerRequestFilter {

  private final SupabaseJwtValidator jwtValidator;
  private final AuthorizationService authorizationService;
  private final ObjectMapper objectMapper;

  public SupabaseJwtAuthenticationFilter(
      SupabaseJwtValidator jwtValidator,
      AuthorizationService authorizationService,
      ObjectMapper objectMapper) {
    this.jwtValidator = jwtValidator;
    this.authorizationService = authorizationService;
    this.objectMapper = objectMapper;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    String token = extractBearerToken(request);
    if (token == null) {
      filterChain.doFilter(request, response);
      return;
    }

    try {
      JwtClaims claims = jwtValidator.validate(token);
      AuthenticatedUser user = authorizationService.resolveAuthUser(claims.userId(), claims.email());
      var authentication = new UsernamePasswordAuthenticationToken(user, token, List.of());
      SecurityContextHolder.getContext().setAuthentication(authentication);
      filterChain.doFilter(request, response);
    } catch (UnauthenticatedException exception) {
      SecurityContextHolder.clearContext();
      response.setStatus(exception.getStatusCode());
      response.setContentType(MediaType.APPLICATION_JSON_VALUE);
      objectMapper.writeValue(response.getWriter(), ApiErrorResponse.from(exception));
    }
  }

  private static String extractBearerToken(HttpServletRequest request) {
    String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
    if (authorization == null || authorization.isBlank()) {
      return null;
    }

    String prefix = "Bearer ";
    if (!authorization.regionMatches(true, 0, prefix, 0, prefix.length())) {
      return null;
    }

    String token = authorization.substring(prefix.length()).trim();
    return token.isEmpty() ? null : token;
  }
}
