import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';

import { Button } from '../components/button/Button';
import { roleThemes, tokens } from '../tokens';

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="space-y-2">
      <div className="h-12 w-full rounded-lg border border-surface-subtle" style={{ backgroundColor: value }} />
      <div>
        <p className="text-ink text-xs font-medium">{name}</p>
        <p className="text-ink-muted font-mono text-xs">{value}</p>
      </div>
    </div>
  );
}

function TokenSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-ink text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

const meta = {
  title: 'Foundation/Design Tokens',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Colors: Story = {
  render: () => (
    <div className="mx-auto max-w-6xl space-y-10 p-6">
      <TokenSection title="Brand">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {Object.entries(tokens.colors.brand).map(([name, value]) => (
            <Swatch key={name} name={`brand-${name}`} value={value} />
          ))}
        </div>
      </TokenSection>

      <TokenSection title="Surfaces">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Object.entries(tokens.colors.surface).map(([name, value]) => (
            <Swatch key={name} name={name === 'DEFAULT' ? 'surface' : `surface-${name}`} value={value} />
          ))}
        </div>
      </TokenSection>

      <TokenSection title="Text (Ink)">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Object.entries(tokens.colors.ink).map(([name, value]) => (
            <Swatch key={name} name={name === 'DEFAULT' ? 'ink' : `ink-${name}`} value={value} />
          ))}
        </div>
      </TokenSection>

      <TokenSection title="Status">
        <div className="grid gap-6 sm:grid-cols-2">
          {Object.entries(tokens.colors.status).map(([name, value]) => (
            <div key={name} className="space-y-3">
              <p className="text-ink text-sm font-medium capitalize">{name}</p>
              <div className="grid grid-cols-3 gap-3">
                <Swatch name="bg" value={value.bg} />
                <Swatch name="border" value={value.border} />
                <Swatch name="foreground" value={value.foreground} />
              </div>
            </div>
          ))}
        </div>
      </TokenSection>
    </div>
  ),
};

export const SpacingRadiiShadows: Story = {
  render: () => (
    <div className="mx-auto max-w-4xl space-y-10 p-6">
      <TokenSection title="Spacing">
        <dl className="grid gap-3 sm:grid-cols-2">
          {Object.entries(tokens.spacing).map(([name, value]) => (
            <div key={name} className="border-surface-subtle flex justify-between rounded-lg border px-4 py-3">
              <dt className="text-ink-muted text-sm">{name}</dt>
              <dd className="text-ink font-mono text-sm">{value}</dd>
            </div>
          ))}
        </dl>
      </TokenSection>

      <TokenSection title="Border radius">
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(tokens.radii).map(([name, value]) => (
            <div key={name} className="border-surface-subtle border bg-white p-4 shadow-sm" style={{ borderRadius: value }}>
              <p className="text-ink text-sm font-medium">{name}</p>
              <p className="text-ink-muted font-mono text-xs">{value}</p>
            </div>
          ))}
        </div>
      </TokenSection>

      <TokenSection title="Shadows">
        <div className="grid gap-6 sm:grid-cols-3">
          {Object.entries(tokens.shadows).map(([name, value]) => (
            <div
              key={name}
              className="border-surface-subtle rounded-xl border bg-white p-6"
              style={{ boxShadow: value }}
            >
              <p className="text-ink text-sm font-medium">{name}</p>
              <p className="text-ink-muted mt-1 font-mono text-xs">{value}</p>
            </div>
          ))}
        </div>
      </TokenSection>

      <TokenSection title="Breakpoints">
        <dl className="grid gap-3 sm:grid-cols-2">
          {Object.entries(tokens.breakpoints).map(([name, value]) => (
            <div key={name} className="border-surface-subtle flex justify-between rounded-lg border px-4 py-3">
              <dt className="text-ink-muted text-sm">{name}</dt>
              <dd className="text-ink font-mono text-sm">{value}</dd>
            </div>
          ))}
        </dl>
      </TokenSection>
    </div>
  ),
};

export const RoleThemes: Story = {
  render: () => (
    <div className="mx-auto max-w-6xl space-y-10 p-6">
      <p className="text-ink-muted text-sm">
        Primary colors switch by role. Use the Storybook toolbar (&quot;Role theme&quot;) to preview
        runtime behavior, or inspect each palette below.
      </p>

      {Object.entries(roleThemes).map(([roleName, palette]) => (
        <TokenSection key={roleName} title={`${roleName} brand scale`}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {Object.entries(palette).map(([step, value]) => (
              <Swatch key={step} name={`brand-${step}`} value={value} />
            ))}
          </div>
        </TokenSection>
      ))}

      <TokenSection title="Live components">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary button</Button>
          <Button variant="secondary">Secondary</Button>
          <span className="bg-brand-50 text-brand-700 rounded-full px-3 py-1 text-xs font-medium">
            Active nav item
          </span>
        </div>
      </TokenSection>
    </div>
  ),
};

export const Typography: Story = {
  render: () => (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-ink text-4xl font-bold tracking-tight sm:text-5xl">Hero heading</h1>
      <h2 className="text-ink text-2xl font-semibold">Page title</h2>
      <h3 className="text-ink text-lg font-semibold">Section title</h3>
      <p className="text-ink text-sm">Body text uses ink on surface backgrounds.</p>
      <p className="text-ink-muted text-sm">Muted text for descriptions and metadata.</p>
      <p className="text-ink-subtle text-sm">Subtle text for placeholders and hints.</p>
      <p className="text-brand-600 text-xs font-semibold uppercase tracking-wide">Eyebrow label</p>
    </div>
  ),
};
