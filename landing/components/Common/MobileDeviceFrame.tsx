import { ReactNode } from "react";

type MobileDeviceFrameProps = {
  children: ReactNode;
};

const MobileDeviceFrame = ({ children }: MobileDeviceFrameProps) => {
  return (
    <div className="relative w-full max-w-[300px] sm:max-w-[330px] md:max-w-[370px]">
      <div className="relative mx-auto aspect-[9/19.5] w-full">
        {/* Side buttons */}
        <span className="absolute -left-[2px] top-[20%] h-12 w-[2px] rounded-full bg-gray-500/70"></span>
        <span className="absolute -left-[2px] top-[33%] h-8 w-[2px] rounded-full bg-gray-500/65"></span>
        <span className="absolute -right-[2px] top-[28%] h-16 w-[2px] rounded-full bg-gray-500/70"></span>

        {/* Device shell */}
        <div className="relative h-full w-full rounded-[2.9rem] bg-[#101114] p-[7px] ring-1 ring-white/10 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.45),0_8px_24px_-12px_rgba(15,23,42,0.35)]">
          {/* Display area */}
          <div className="relative h-full w-full overflow-hidden rounded-[2.45rem] bg-black">
            {/* Speaker */}
            <span className="pointer-events-none absolute left-1/2 top-1.5 z-20 h-[4px] w-14 -translate-x-1/2 rounded-full bg-white/20"></span>
            {/* Dynamic Island */}
            <span className="pointer-events-none absolute left-1/2 top-3 z-20 h-7 w-28 -translate-x-1/2 rounded-full bg-black/95 ring-1 ring-white/10"></span>

            <div className="relative h-full w-full">{children}</div>

            {/* Glass reflection */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.06)_22%,rgba(255,255,255,0)_45%)]"></div>
          </div>

          {/* Bottom chin highlight */}
          <span className="pointer-events-none absolute bottom-[3px] left-1/2 h-[3px] w-24 -translate-x-1/2 rounded-full bg-white/10"></span>
        </div>
      </div>
    </div>
  );
};

export default MobileDeviceFrame;
