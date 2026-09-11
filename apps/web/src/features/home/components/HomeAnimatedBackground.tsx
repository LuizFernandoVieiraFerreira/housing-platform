import { cn } from '@housing-platform/utils';

/*
 * Decorative parallax layers drifting over the hero skyline. Positions and sizes are
 * percentages so every layer scales with the hero box instead of needing a breakpoint
 * per element, and the `pt-*` values are the aspect-ratio trick that gives these empty
 * spans a height — each SVG is painted as a background, so there is no content to size.
 */
const layers = [
  {
    key: 'cloud-left',
    // z-20 puts this one cloud in front of the drone; the others pass behind it.
    className: 'bg-city-cloud animate-cloud-drift-out left-[4%] top-[29%] z-20 w-[5.5%] pt-[2.75%]',
  },
  {
    key: 'cloud-left-large',
    className: 'bg-city-cloud-large animate-cloud-drift-in left-0 top-[24%] w-[10%] pt-[5%]',
  },
  {
    key: 'cloud-right',
    className: 'bg-city-cloud animate-cloud-drift right-0 top-[22%] w-[5.5%] pt-[2.75%]',
  },
  {
    key: 'drone',
    className: 'bg-city-drone animate-drone-patrol left-[8%] top-[44%] w-[6%] pt-[2.5%]',
  },
];

export function HomeAnimatedBackground() {
  return (
    /*
     * Hidden until `md`, where the skyline these layers sit on first appears. `z-0`
     * opens a stacking context so the layer z-indexes below stay local, and keeps the
     * whole group beneath the hero content. At `xl` the layers align to the centred
     * content column rather than the viewport, so the clouds stay near the buildings.
     */
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 hidden md:block xl:mx-auto xl:w-[1200px]"
    >
      <div className="relative h-full w-full">
        {layers.map(({ key, className }) => (
          <span
            key={key}
            className={cn(
              'absolute z-10 bg-bottom bg-no-repeat motion-reduce:animate-none',
              className,
            )}
          />
        ))}
      </div>
    </div>
  );
}
