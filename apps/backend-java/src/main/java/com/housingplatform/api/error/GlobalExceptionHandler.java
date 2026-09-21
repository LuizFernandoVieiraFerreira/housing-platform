package com.housingplatform.api.error;

import com.housingplatform.auth.error.AppException;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(AppException.class)
  public ResponseEntity<ApiErrorResponse> handleAppException(AppException exception) {
    return ResponseEntity.status(exception.getStatusCode())
        .body(ApiErrorResponse.from(exception));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiErrorResponse> handleValidationException(
      MethodArgumentNotValidException exception) {
    return ResponseEntity.badRequest()
        .body(
            new ApiErrorResponse(
                new ApiErrorResponse.ErrorBody(
                    "VALIDATION_ERROR",
                    "Request validation failed",
                    Map.of("issues", exception.getBindingResult().getFieldErrors()))));
  }
}
