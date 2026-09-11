import { Button, Input } from '@housing-platform/ui';
import { useState, type FormEvent } from 'react';

interface AiSearchBarProps {
  initialQuery?: string;
  isLoading?: boolean;
  onSearch: (query: string) => void;
}

export function AiSearchBar({ initialQuery = '', isLoading = false, onSearch }: AiSearchBarProps) {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();

    if (!trimmed) {
      return;
    }

    onSearch(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="border-surface-subtle border-b bg-white px-4 py-3">
      <div className="flex gap-2">
        <Input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Describe what you're looking for…"
          aria-label="Smart property search"
          className="min-w-0 flex-1"
        />
        <Button type="submit" size="sm" disabled={isLoading || !query.trim()}>
          {isLoading ? 'Searching…' : 'Smart search'}
        </Button>
      </div>
    </form>
  );
}
