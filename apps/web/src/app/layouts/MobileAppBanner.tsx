const APP_DOWNLOAD_URL = '#';
const MARQUEE_SEGMENT_COUNT = 10;

function BannerSegment() {
  return (
    <span className="flex shrink-0 items-center gap-2 px-3 text-xs font-bold text-white">
      <span aria-hidden="true">🎉</span>
      <span>Housing Platform App Released! Download Now!</span>
      <span className="text-brand-500 whitespace-nowrap rounded-full bg-white px-2.5 py-px text-[11px] font-bold leading-[1.35]">
        Download app
      </span>
    </span>
  );
}

function MarqueeGroup({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div className="flex shrink-0" aria-hidden={ariaHidden || undefined}>
      {Array.from({ length: MARQUEE_SEGMENT_COUNT }, (_, index) => (
        <BannerSegment key={index} />
      ))}
    </div>
  );
}

export function MobileAppBanner() {
  return (
    <div className="shrink-0 md:hidden">
      <a
        href={APP_DOWNLOAD_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Housing Platform App Released! Download Now!"
        className="from-brand-500 to-brand-600 flex h-[30px] select-none items-center overflow-hidden bg-gradient-to-r transition-[filter] duration-150 hover:brightness-105"
      >
        <div className="animate-app-banner-marquee flex w-max motion-reduce:animate-none">
          <MarqueeGroup />
          <MarqueeGroup ariaHidden />
        </div>
      </a>
    </div>
  );
}
