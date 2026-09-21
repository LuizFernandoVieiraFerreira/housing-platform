package com.housingplatform.api.error;

import com.housingplatform.shared.auth.error.AppException;
import java.util.Map;

public record ApiErrorResponse(ErrorBody error) {

  public record ErrorBody(String code, String message, Map<String, Object> details) {}

  public static ApiErrorResponse from(AppException exception) {
    return new ApiErrorResponse(
        new ErrorBody(exception.getCode(), exception.getMessage(), exception.getDetails()));
  }
}
