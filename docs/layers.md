# Feature Layers

Each feature follows this layered structure:

```
features/<name>/
├── model/       # Pure domain (no React)
├── api/         # Data fetching
├── state/       # Client state
├── hooks/       # Composition
├── components/  # UI
└── index.ts     # Public API
```

## Layer Rules

```
model/ ← api/ ← state/ ← hooks/ ← components/
```

| Layer | Imports From | Contains |
|-------|--------------|----------|
| `model/` | Nothing | Types, schemas, constants, pure utils |
| `api/` | model | Supabase queries, mappers |
| `state/` | model | Form state, local state hooks |
| `hooks/` | model, api, state | React Query hooks, presenters |
| `components/` | All | UI rendering |

## model/ (Pure Domain)

```
model/
├── types.ts      # Types (re-export shared + local)
├── schemas.ts    # Zod schemas
├── constants.ts  # Business rules, config
├── utils.ts      # Pure functions
└── index.ts
```

**Rules:**
- No React imports
- No i18n
- No API calls
- 100% testable without mocking

## api/ (Data Access)

```
api/
├── <name>-api.ts  # Supabase queries
└── mappers.ts     # Row → Model transformations
```

**Mappers convert:**
- Supabase rows (snake_case) → Domain models (camelCase)
- Form values → API request params

## hooks/ (Presenters)

Combine API + state into UI-ready interface:

```typescript
function useBookingPanel({ property }) {
  const form = useBookingForm(...);
  const quote = useBookingQuote(...);
  const mutation = useCreateBooking();
  
  return {
    state: determineState(),
    form,
    quote,
    handleSubmit,
    // ... UI-ready data
  };
}
```

## components/ (UI)

- Receive data from hooks
- No business logic
- Small, focused components
