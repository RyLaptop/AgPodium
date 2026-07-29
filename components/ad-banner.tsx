type AdBannerProps = {
  variant?: "ffac" | "apartment" | "footer";
};

export function AdBanner({ variant = "ffac" }: AdBannerProps) {
  if (variant === "footer") {
    return (
      <div className="w-full overflow-hidden h-[50px] md:h-[94px]">
        <img src="/stillbright-ad-mobile-320x50.svg" alt="Advertisement" className="md:hidden" style={{ display: "block", width: "100%", height: "50px" }} />
        <img src="/stillbright-ad-1120x104.svg" alt="Advertisement" className="hidden md:block w-full h-full object-cover" />
      </div>
    );
  }

  if (variant === "apartment") {
    return (
      <div className="w-full overflow-hidden h-[75px] md:h-[120px]">
        <img src="/theapartment-ad-mobile-320x100.svg" alt="Advertisement" className="w-full h-full object-cover md:hidden" />
        <img src="/theapartment-ad-1120x120.svg" alt="Advertisement" className="hidden md:block w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden h-[75px] md:h-[120px]">
      <img src="/ffac-ad-mobile-320x100.svg" alt="Advertisement" className="w-full h-full object-cover md:hidden" />
      <img src="/ffac-ad-1120x120.svg" alt="Advertisement" className="hidden md:block w-full h-full object-cover" />
    </div>
  );
}
