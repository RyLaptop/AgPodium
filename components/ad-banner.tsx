const AD_LINKS = {
  ffac: "https://foodiesforacause.org",
  apartment: "https://cstx.gov",
  footer: "https://www.alz.org/?form=FUNDHYMMBXU",
  calendar: "https://foodiesforacause.org",
};

type AdBannerProps = {
  variant?: "ffac" | "apartment" | "footer" | "calendar";
};

export function AdBanner({ variant = "ffac" }: AdBannerProps) {
  const href = AD_LINKS[variant];

  if (variant === "footer") {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block w-full overflow-hidden h-[50px] md:h-[94px]">
        <img src="/stillbright-ad-mobile-320x50.svg" alt="Advertisement" className="md:hidden" style={{ width: "100%", height: "50px" }} />
        <img src="/stillbright-ad-1120x104.svg" alt="Advertisement" className="hidden md:block w-full h-full object-cover" />
      </a>
    );
  }

  if (variant === "apartment") {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block w-full overflow-hidden h-[75px] md:h-[120px]">
        <img src="/collegestation-ad-mobile-320x100.svg" alt="Advertisement" className="w-full h-full object-cover md:hidden" />
        <img src="/collegestation-ad-1120x120.svg" alt="Advertisement" className="hidden md:block w-full h-full object-cover" />
      </a>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block w-full overflow-hidden h-[75px] md:h-[120px]">
      <img src="/new-ad-mobile-320x100.svg" alt="Advertisement" className="w-full h-full object-cover md:hidden" />
      <img src="/ffac-ad-1120x120.svg" alt="Advertisement" className="hidden md:block w-full h-full object-cover" />
    </a>
  );
}
