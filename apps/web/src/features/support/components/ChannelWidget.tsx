import { useEffect, useRef, useState } from 'react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { fetchChannelBoot, getChannelPluginKey } from '@/features/support/api/channel-api';
import {
  bootChannel,
  hideChannelButton,
  loadChannelScript,
  showChannelMessenger,
  shutdownChannel,
  type ChannelBootConfig,
} from '@/features/support/lib/channel-script';

const channelBootOptions = {
  hideChannelButtonOnBoot: true,
} as const;

export function ChannelWidget() {
  const { isAuthenticated, isLoading } = useAuth();
  const bootTokenRef = useRef(0);
  const [isChannelReady, setIsChannelReady] = useState(false);
  const pluginKey = getChannelPluginKey();

  useEffect(() => {
    if (!pluginKey) {
      return;
    }

    const resolvedPluginKey = pluginKey;

    const bootToken = ++bootTokenRef.current;
    let cancelled = false;

    async function syncChannelWidget() {
      setIsChannelReady(false);

      try {
        await loadChannelScript();
      } catch {
        return;
      }

      if (cancelled || bootToken !== bootTokenRef.current) {
        return;
      }

      if (isLoading) {
        return;
      }

      shutdownChannel();

      const finishBoot = () => {
        if (cancelled || bootToken !== bootTokenRef.current) {
          return;
        }

        hideChannelButton();
        setIsChannelReady(true);
      };

      if (!isAuthenticated) {
        bootChannel({ pluginKey: resolvedPluginKey, ...channelBootOptions }, finishBoot);
        return;
      }

      try {
        const bootData = await fetchChannelBoot();

        if (cancelled || bootToken !== bootTokenRef.current) {
          return;
        }

        const config: ChannelBootConfig = {
          pluginKey: bootData.pluginKey ?? resolvedPluginKey,
          ...channelBootOptions,
        };

        if (bootData.memberId) {
          config.memberId = bootData.memberId;
        }

        if (bootData.memberHash) {
          config.memberHash = bootData.memberHash;
        }

        if (bootData.profile) {
          config.profile = bootData.profile;
        }

        bootChannel(config, finishBoot);
      } catch {
        if (cancelled || bootToken !== bootTokenRef.current) {
          return;
        }

        bootChannel({ pluginKey: resolvedPluginKey, ...channelBootOptions }, finishBoot);
      }
    }

    void syncChannelWidget();

    return () => {
      cancelled = true;
      setIsChannelReady(false);
    };
  }, [isAuthenticated, isLoading, pluginKey]);

  if (!pluginKey) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label="Open chat support"
      disabled={!isChannelReady}
      onClick={() => showChannelMessenger()}
      className="fixed bottom-20 right-4 z-40 h-14 w-14 overflow-hidden rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-70 md:bottom-6"
    >
      <img src="/favicon.svg" alt="" className="h-full w-full object-cover" />
    </button>
  );
}
