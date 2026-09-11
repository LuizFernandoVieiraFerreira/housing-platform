import { Alert, Button, Card, PageHeader } from '@housing-platform/ui';
import { useEffect, useState } from 'react';

import { getChannelPluginKey } from '@/features/support/api/channel-api';
import { loadChannelScript, showChannelMessenger } from '@/features/support/lib/channel-script';

export function MessagesPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pluginKey = getChannelPluginKey();

    if (!pluginKey) {
      setError('Channel.io is not configured. Add VITE_CHANNEL_PLUGIN_KEY to enable chat.');
      return;
    }

    void loadChannelScript()
      .then(() => {
        showChannelMessenger();
      })
      .catch(() => {
        setError('Unable to load chat. Please try again in a moment.');
      });
  }, []);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg px-4 py-16">
      <Card padding="lg" className="w-full text-center">
        <PageHeader
          title="Chat"
          description="Message the Housing Platform team about bookings, move-in dates, or housing questions."
        />

        {error ? (
          <Alert variant="error" className="mt-6 text-left">
            {error}
          </Alert>
        ) : (
          <p className="text-ink-muted mt-6 text-sm">
            Your chat window should open automatically. If it did not, use the button below.
          </p>
        )}

        {!error ? (
          <Button type="button" className="mt-6" onClick={() => showChannelMessenger()}>
            Open chat
          </Button>
        ) : null}
      </Card>
    </div>
  );
}
