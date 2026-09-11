import type { ChannelBootProfile } from '@housing-platform/types';

declare global {
  interface Window {
    ChannelIO?: ChannelIoFn;
    ChannelIOInitialized?: boolean;
  }
}

type ChannelIoFn = ((...args: unknown[]) => void) & {
  q?: unknown[][];
  c?: (...args: unknown[]) => void;
};

const CHANNEL_SCRIPT_SRC = 'https://cdn.channel.io/plugin/ch-plugin-web.js';

let scriptPromise: Promise<void> | null = null;

function installChannelStub(): void {
  if (window.ChannelIO) {
    return;
  }

  const queue: unknown[][] = [];
  const channelIo: ChannelIoFn = (...args) => {
    queue.push(args);
  };

  channelIo.q = queue;
  channelIo.c = (...args: unknown[]) => {
    queue.push(args);
  };

  window.ChannelIO = channelIo;
}

function injectChannelScript(): Promise<void> {
  installChannelStub();

  if (window.ChannelIOInitialized) {
    return Promise.resolve();
  }

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = CHANNEL_SCRIPT_SRC;

      script.onload = () => {
        window.ChannelIOInitialized = true;
        resolve();
      };

      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('Unable to load Channel.io script'));
      };

      const firstScript = document.getElementsByTagName('script')[0];

      if (firstScript?.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        document.head.appendChild(script);
      }
    });
  }

  return scriptPromise;
}

export async function loadChannelScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  if (document.readyState === 'complete') {
    await injectChannelScript();
    return;
  }

  await new Promise<void>((resolve) => {
    const boot = () => {
      void injectChannelScript().then(resolve);
    };

    if (document.readyState === 'interactive') {
      boot();
      return;
    }

    window.addEventListener('DOMContentLoaded', boot, { once: true });
    window.addEventListener('load', boot, { once: true });
  });
}

export interface ChannelBootConfig {
  pluginKey: string;
  memberId?: string;
  memberHash?: string;
  profile?: ChannelBootProfile;
  hideChannelButtonOnBoot?: boolean;
}

export function bootChannel(config: ChannelBootConfig, onBoot?: () => void): void {
  let finished = false;

  const finish = () => {
    if (finished) {
      return;
    }

    finished = true;
    hideChannelButton();
    onBoot?.();
  };

  window.ChannelIO?.('boot', config, finish);
  window.setTimeout(finish, 1000);
}

export function shutdownChannel(): void {
  window.ChannelIO?.('shutdown');
}

export function hideChannelButton(): void {
  window.ChannelIO?.('hideChannelButton');
}

export function showChannelMessenger(): void {
  window.ChannelIO?.('showMessenger');
}
