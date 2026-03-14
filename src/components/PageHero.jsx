import Container from "./Container";
import Button from "./Button";

/**
 * Reusable page hero (photo + overlay + colored band + actions).
 * Optional side image inside the band (desktop+):
 * - sideImageSrc, sideImageAlt
 */
export default function PageHero({
  imageSrc,
  imageAlt,
  heightClass = "h-[68vh] md:h-[75vh]",
  overlayClass = "bg-black/30",
  bandColorVar = "var(--color-scx-primary)",
  titleLines = [],
  description,
  actions = [],
  className = "",
  sideImageSrc,
  sideImageAlt = "",
}) {
  const hasSide = !!sideImageSrc;

  return (
    <section className={`relative ${className}`}>
      {/* Background image */}
      <img
        src={imageSrc}
        alt={imageAlt}
        className={`w-full ${heightClass} object-cover`}
        fetchPriority="high"
      />

      {/* Dark overlay */}
      <div className={`absolute inset-0 ${overlayClass}`} />

      {/* Bottom band */}
      <div className="absolute inset-0 flex items-end">
        <div
          className="w-full bg-[var(--band-bg)] px-4 py-6 md:py-10 text-white"
          style={{ "--band-bg": bandColorVar }}
        >
          <Container>
            {/* This is the ONLY layout container that matters */}
            <div className="mx-auto w-full max-w-5xl">
              <div
                className={
                  hasSide
                    ? "grid items-center gap-8 md:grid-cols-2"
                    : "text-center"
                }
              >
                {/* Left image (desktop+) */}
                {hasSide ? (
                  <div className="hidden md:block">
                    <div className="overflow-hidden rounded-3xl border border-white/15 bg-white/5 shadow-2xl">
                      <img
                        src={sideImageSrc}
                        alt={sideImageAlt}
                        className="w-full h-[320px] object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>
                ) : null}

                {/* Text */}
                <div className={hasSide ? "text-center md:text-left" : ""}>
                  <h1 className="font-extrabold leading-tight text-[34px] md:text-[52px]">
                    {titleLines.map((line, i) => (
                      <span key={i}>
                        {line}
                        {i !== titleLines.length - 1 && (
                          <>
                            <br className="hidden md:block" />{" "}
                          </>
                        )}
                      </span>
                    ))}
                  </h1>

                  {description && (
                    <p className="mt-3 max-w-[40ch] font-medium text-[15px] md:text-[16px]">
                      {description}
                    </p>
                  )}

                  {actions.length > 0 && (
                    <div
                      className={`mt-5 flex flex-wrap gap-3 ${
                        hasSide
                          ? "justify-center md:justify-start"
                          : "justify-center"
                      }`}
                    >
                      {actions.map((a, i) => (
                        <Button
                          key={i}
                          href={a.href}
                          bgVar={a.bgVar}
                          fgVar={a.fgVar}
                          variant={a.variant || "solid"}
                        >
                          {a.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Container>
        </div>
      </div>
    </section>
  );
}
