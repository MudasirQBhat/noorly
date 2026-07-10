// Noorly logo — an open Qur'an radiating light (noor). Uses the brand PNG
// (transparent, cleaned from the provided artwork). `animated` is accepted for
// backward-compatibility but the mark is now a static image.
export default function Logo({ size = 48, animated = true, className = "" }) {
  return (
    <img
      src="/logo.png"
      width={size}
      height={size}
      className={`noor-logo ${className}`}
      alt="Noorly"
      draggable="false"
      style={{ objectFit: "contain", display: "block" }}
    />
  );
}
