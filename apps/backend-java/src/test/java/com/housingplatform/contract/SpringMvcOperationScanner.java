package com.housingplatform.contract;

import com.housingplatform.features.admin.AdminController;
import com.housingplatform.api.HealthController;
import com.housingplatform.features.bookings.BookingController;
import com.housingplatform.features.hosts.HostController;
import com.housingplatform.features.notifications.NotificationController;
import com.housingplatform.features.payments.PaymentController;
import com.housingplatform.features.profile.ProfileController;
import com.housingplatform.features.properties.AmenityController;
import com.housingplatform.features.properties.PropertyController;
import com.housingplatform.features.properties.RoomController;
import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;

public final class SpringMvcOperationScanner {

  private static final List<Class<?>> CONTROLLERS =
      List.of(
          HealthController.class,
          PropertyController.class,
          RoomController.class,
          AmenityController.class,
          BookingController.class,
          PaymentController.class,
          HostController.class,
          AdminController.class,
          NotificationController.class,
          ProfileController.class);

  private SpringMvcOperationScanner() {}

  public static Map<ContractSupport.OperationKey, String> scanOperations(String apiPrefix) {
    Map<ContractSupport.OperationKey, String> operations = new LinkedHashMap<>();

    for (Class<?> controller : CONTROLLERS) {
      String classPath = resolveClassPath(controller, apiPrefix);
      for (Method method : controller.getDeclaredMethods()) {
        for (MethodMapping mapping : readMethodMappings(method)) {
          for (String methodPath : mapping.paths()) {
            String fullPath = combinePaths(classPath, methodPath);
            operations.put(
                new ContractSupport.OperationKey(
                    ContractSupport.normalizePath(fullPath), mapping.httpMethod()),
                fullPath);
          }
        }
      }
    }

    return operations;
  }

  private static String resolveClassPath(Class<?> controller, String apiPrefix) {
    RequestMapping requestMapping = controller.getAnnotation(RequestMapping.class);
    if (requestMapping == null) {
      return apiPrefix;
    }

    String[] paths = firstNonEmpty(requestMapping.path(), requestMapping.value());
    if (paths.length == 0) {
      return apiPrefix;
    }
    return paths[0].replace("${housing-platform.api-prefix}", apiPrefix);
  }

  private static List<MethodMapping> readMethodMappings(Method method) {
    List<MethodMapping> mappings = new ArrayList<>();

    appendMapping(mappings, "get", method.getAnnotation(GetMapping.class));
    appendMapping(mappings, "post", method.getAnnotation(PostMapping.class));
    appendMapping(mappings, "patch", method.getAnnotation(PatchMapping.class));
    appendMapping(mappings, "put", method.getAnnotation(PutMapping.class));
    appendMapping(mappings, "delete", method.getAnnotation(DeleteMapping.class));

    RequestMapping requestMapping = method.getAnnotation(RequestMapping.class);
    if (requestMapping != null) {
      String[] paths = firstNonEmpty(requestMapping.path(), requestMapping.value());
      if (paths.length == 0) {
        paths = new String[] {""};
      }
      for (org.springframework.web.bind.annotation.RequestMethod httpMethod :
          requestMapping.method()) {
        mappings.add(new MethodMapping(httpMethod.name().toLowerCase(), paths));
      }
    }

    return mappings;
  }

  private static void appendMapping(
      List<MethodMapping> mappings, String httpMethod, Annotation mappingAnnotation) {
    if (mappingAnnotation == null) {
      return;
    }

    String[] paths;
    if (mappingAnnotation instanceof GetMapping getMapping) {
      paths = firstNonEmpty(getMapping.path(), getMapping.value());
    } else if (mappingAnnotation instanceof PostMapping postMapping) {
      paths = firstNonEmpty(postMapping.path(), postMapping.value());
    } else if (mappingAnnotation instanceof PatchMapping patchMapping) {
      paths = firstNonEmpty(patchMapping.path(), patchMapping.value());
    } else if (mappingAnnotation instanceof PutMapping putMapping) {
      paths = firstNonEmpty(putMapping.path(), putMapping.value());
    } else if (mappingAnnotation instanceof DeleteMapping deleteMapping) {
      paths = firstNonEmpty(deleteMapping.path(), deleteMapping.value());
    } else {
      return;
    }

    if (paths.length == 0) {
      paths = new String[] {""};
    }
    mappings.add(new MethodMapping(httpMethod, paths));
  }

  private static String[] firstNonEmpty(String[] primary, String[] secondary) {
    if (primary.length > 0) {
      return primary;
    }
    return secondary;
  }

  private static String combinePaths(String base, String subPath) {
    if (subPath == null || subPath.isBlank()) {
      return trimTrailingSlash(base);
    }
    if (base.endsWith("/") && subPath.startsWith("/")) {
      return trimTrailingSlash(base + subPath.substring(1));
    }
    if (!base.endsWith("/") && !subPath.startsWith("/")) {
      return trimTrailingSlash(base + "/" + subPath);
    }
    return trimTrailingSlash(base + subPath);
  }

  private static String trimTrailingSlash(String path) {
    if (path.length() > 1 && path.endsWith("/")) {
      return path.substring(0, path.length() - 1);
    }
    return path;
  }

  private record MethodMapping(String httpMethod, String[] paths) {}
}
