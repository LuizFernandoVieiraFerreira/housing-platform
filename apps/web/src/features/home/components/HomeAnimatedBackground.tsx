export function HomeAnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Background city silhouette - scales to full width, height adjusts proportionally */}
      <img
        src="/images/background-cidade-fundo.svg"
        alt=""
        className="absolute bottom-0 left-0 w-full opacity-20"
        style={{
          height: 'auto',
        }}
      />

      {/* Cloud - left small */}
      <div
        className="animate-cloud-float-left absolute left-[5%] top-[15%] h-16 w-24 opacity-60 sm:h-20 sm:w-32 lg:h-24 lg:w-40"
        style={{
          backgroundImage: 'url(/images/background-cidade-nuvem.svg)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Cloud - left large */}
      <div
        className="animate-cloud-float-large absolute left-[10%] top-[30%] h-20 w-32 opacity-50 sm:h-28 sm:w-44 lg:h-32 lg:w-52"
        style={{
          backgroundImage: 'url(/images/background-cidade-nuvem-grande.svg)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Cloud - right */}
      <div
        className="animate-cloud-float-right absolute right-[8%] top-[20%] h-16 w-24 opacity-60 sm:h-20 sm:w-32 lg:h-24 lg:w-40"
        style={{
          backgroundImage: 'url(/images/background-cidade-nuvem.svg)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Drone */}
      <div
        className="animate-drone-fly absolute left-0 top-[25%] h-8 w-12 sm:h-10 sm:w-16 lg:h-12 lg:w-20"
        style={{
          backgroundImage: 'url(/images/background-cidade-drone.svg)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
        }}
      />
    </div>
  );
}
