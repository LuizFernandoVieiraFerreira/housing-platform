import { RequestMethod, Type } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';

import { HealthController } from '../../api/health/health.controller';
import { AdminController } from '../../features/admin/admin.controller';
import { BookingsController } from '../../features/bookings/bookings.controller';
import { HostsController } from '../../features/hosts/hosts.controller';
import { NotificationsController } from '../../features/notifications/notifications.controller';
import { PaymentsController } from '../../features/payments/payments.controller';
import { ProfileController } from '../../features/profile/profile.controller';
import { AmenitiesController } from '../../features/properties/amenities.controller';
import { PropertiesController } from '../../features/properties/properties.controller';
import { RoomsController } from '../../features/properties/rooms.controller';
import {
  API_PREFIX,
  normalizePath,
  operationKeyToString,
  type OperationKey,
} from './contract';

const HTTP_METHODS: Record<number, string> = {
  [RequestMethod.GET]: 'get',
  [RequestMethod.POST]: 'post',
  [RequestMethod.PUT]: 'put',
  [RequestMethod.PATCH]: 'patch',
  [RequestMethod.DELETE]: 'delete',
  [RequestMethod.HEAD]: 'head',
  [RequestMethod.OPTIONS]: 'options',
};

const CONTROLLERS: Type[] = [
  HealthController,
  PropertiesController,
  RoomsController,
  AmenitiesController,
  BookingsController,
  PaymentsController,
  HostsController,
  AdminController,
  NotificationsController,
  ProfileController,
];

function trimTrailingSlash(path: string): string {
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

function combinePaths(base: string, subPath: string): string {
  if (!subPath) {
    return trimTrailingSlash(base);
  }

  if (base.endsWith('/') && subPath.startsWith('/')) {
    return trimTrailingSlash(base + subPath.slice(1));
  }

  if (!base.endsWith('/') && !subPath.startsWith('/')) {
    return trimTrailingSlash(`${base}/${subPath}`);
  }

  return trimTrailingSlash(base + subPath);
}

function scanController(
  ControllerClass: Type,
  apiPrefix: string,
): Map<string, string> {
  const operations = new Map<string, string>();
  const controllerPath =
    (Reflect.getMetadata(PATH_METADATA, ControllerClass) as string | undefined) ??
    '';
  const classBase = combinePaths(apiPrefix, controllerPath);
  const prototype = ControllerClass.prototype as Record<string, unknown>;

  for (const methodName of Object.getOwnPropertyNames(prototype)) {
    if (methodName === 'constructor') {
      continue;
    }

    const handler = prototype[methodName];
    if (typeof handler !== 'function') {
      continue;
    }

    const routePath = Reflect.getMetadata(PATH_METADATA, handler) as
      | string
      | string[]
      | undefined;
    const requestMethod = Reflect.getMetadata(METHOD_METADATA, handler) as
      | number
      | undefined;

    if (requestMethod === undefined) {
      continue;
    }

    const httpMethod = HTTP_METHODS[requestMethod];
    if (!httpMethod) {
      continue;
    }

    const segments = Array.isArray(routePath)
      ? routePath
      : routePath !== undefined
        ? [routePath]
        : [''];

    for (const segment of segments) {
      const fullPath = combinePaths(classBase, segment ?? '');
      const key = operationKeyToString({
        normalizedPath: normalizePath(fullPath),
        method: httpMethod,
      });
      operations.set(key, fullPath);
    }
  }

  return operations;
}

export function scanNestOperations(apiPrefix = API_PREFIX): Map<string, string> {
  const operations = new Map<string, string>();

  for (const controller of CONTROLLERS) {
    for (const [key, path] of scanController(controller, apiPrefix)) {
      operations.set(key, path);
    }
  }

  return operations;
}

export function listRequiredOperationKeys(): OperationKey[] {
  return [
    { normalizedPath: '/api/v1/properties', method: 'get' },
    { normalizedPath: '/api/v1/properties', method: 'post' },
    { normalizedPath: '/api/v1/properties/{}', method: 'get' },
    { normalizedPath: '/api/v1/properties/{}/submit-review', method: 'post' },
    { normalizedPath: '/api/v1/properties/{}/location', method: 'post' },
    { normalizedPath: '/api/v1/bookings/quote', method: 'get' },
    { normalizedPath: '/api/v1/bookings', method: 'get' },
    { normalizedPath: '/api/v1/bookings', method: 'post' },
    { normalizedPath: '/api/v1/bookings/{}/cancel', method: 'post' },
    { normalizedPath: '/api/v1/bookings/{}/approve', method: 'post' },
    { normalizedPath: '/api/v1/bookings/{}/reject', method: 'post' },
    { normalizedPath: '/api/v1/payments/orders', method: 'post' },
    { normalizedPath: '/api/v1/payments/confirm', method: 'post' },
    { normalizedPath: '/api/v1/payments/webhook', method: 'post' },
    { normalizedPath: '/api/v1/hosts', method: 'post' },
    { normalizedPath: '/api/v1/hosts/me', method: 'get' },
    { normalizedPath: '/api/v1/admin/stats', method: 'get' },
    { normalizedPath: '/api/v1/notifications', method: 'get' },
    { normalizedPath: '/api/v1/notifications/unread-count', method: 'get' },
    { normalizedPath: '/api/v1/profile', method: 'get' },
    { normalizedPath: '/api/v1/profile', method: 'patch' },
  ];
}
