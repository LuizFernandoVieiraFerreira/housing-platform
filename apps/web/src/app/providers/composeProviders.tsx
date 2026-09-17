/**
 * Provider composition utility.
 *
 * Flattens deeply nested providers into a readable, declarative list.
 *
 * @example
 * const AppProviders = composeProviders([
 *   [QueryClientProvider, { client: queryClient }],
 *   AuthProvider,
 *   [ThemeProvider, { theme: 'dark' }],
 * ]);
 *
 * // Usage
 * <AppProviders>
 *   <App />
 * </AppProviders>
 */

import type { ComponentType, ReactNode } from 'react';

/**
 * Provider with no required props (just children).
 */
type SimpleProvider = ComponentType<{ children: ReactNode }>;

/**
 * Provider with additional required props.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProviderWithProps = [ComponentType<any>, Record<string, unknown>];

/**
 * Provider definition - either a simple component or [component, props] tuple.
 */
export type ProviderDefinition = SimpleProvider | ProviderWithProps;

/**
 * Compose multiple providers into a single component.
 *
 * Providers are applied in order (first in list = outermost in tree).
 *
 * @param providers - Array of provider definitions
 * @returns A component that wraps children in all providers
 *
 * @example
 * // Simple providers (no props needed)
 * const Providers = composeProviders([
 *   AuthProvider,
 *   ThemeProvider,
 * ]);
 *
 * @example
 * // Providers with props
 * const Providers = composeProviders([
 *   [QueryClientProvider, { client: queryClient }],
 *   [RouterProvider, { router }],
 *   AuthProvider,
 * ]);
 */
export function composeProviders(
  providers: readonly ProviderDefinition[],
): ComponentType<{ children: ReactNode }> {
  return function ComposedProviders({ children }: { children: ReactNode }) {
    return providers.reduceRight<ReactNode>((acc, definition) => {
      if (Array.isArray(definition)) {
        const [Component, props] = definition;
        return <Component {...props}>{acc}</Component>;
      }

      const Component = definition;
      return <Component>{acc}</Component>;
    }, children);
  };
}
