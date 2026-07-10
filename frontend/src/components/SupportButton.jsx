import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SUPPORT, upiLink } from "../lib/support.js";

function CoffeeIcon({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" /><path d="M17 9h2a2.5 2.5 0 0 1 0 5h-2" /><path d="M7 3v1.5M10.5 3v1.5M14 3v1.5" />
    </svg>
  );
}

function GlobeIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </svg>
  );
}

function PhoneIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="6" y="2" width="12" height="20" rx="3" /><path d="M11 18.5h2" />
    </svg>
  );
}

function CopyIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="12" height="12" rx="2.5" /><path d="M5 15V5.5A2.5 2.5 0 0 1 7.5 3H15" />
    </svg>
  );
}

export default function SupportButton({ variant = "link" }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const closeRef = useRef(null);
  const hasPrimary = !!SUPPORT.primary?.url;
  const hasUpi = !!SUPPORT.upi?.id;

  // Proper modal behaviour: Escape closes, the page behind can't scroll,
  // and focus moves into the dialog when it opens.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  function copyUpi() {
    navigator.clipboard?.writeText(SUPPORT.upi.id).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1600);
    });
  }

  return (
    <>
      <button className={`support-btn ${variant === "chip" ? "support-chip" : ""}`} onClick={() => setOpen(true)}>
        <CoffeeIcon /> Support
      </button>

      {open && createPortal(
        <div className="support-overlay" onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-labelledby="support-title">
          <div className="support-modal" onClick={(e) => e.stopPropagation()}>
            <button ref={closeRef} className="support-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>

            <div className="support-head">
              <span className="support-emoji"><CoffeeIcon size={24} /></span>
              <h3 id="support-title">{SUPPORT.headline}</h3>
              <p>{SUPPORT.message}</p>
            </div>

            <div className="support-cols">
              {hasPrimary && (
                <section className="support-pane support-pane-global">
                  <span className="support-pane-badge"><GlobeIcon /> Worldwide</span>
                  <h4>Card or PayPal</h4>
                  <p>Give from anywhere in about a minute.</p>
                  <ul className="support-pane-list">
                    <li>Give any amount, one time</li>
                    <li>Pay by card or PayPal balance</li>
                    <li>Secure — handled by PayPal</li>
                  </ul>
                  <div className="support-pane-cta">
                    <a className="btn btn-gold support-primary" href={SUPPORT.primary.url} target="_blank" rel="noreferrer noopener">
                      {SUPPORT.primary.label}
                    </a>
                    <span className="support-pane-note">You'll be taken to paypal.me</span>
                  </div>
                </section>
              )}

              {hasUpi && (
                <section className="support-pane support-pane-upi">
                  <span className="support-pane-badge"><PhoneIcon /> India</span>
                  <h4>UPI — zero fees</h4>
                  {SUPPORT.upi.qr && (
                    <img className="support-qr" src={SUPPORT.upi.qr} width="150" height="150"
                      alt={`UPI QR code for ${SUPPORT.upi.name} — scan to pay`} />
                  )}
                  <span className="support-pane-note">Scan with GPay · PhonePe · Paytm</span>
                  <div className="support-upi-row">
                    <code>{SUPPORT.upi.id}</code>
                    <button onClick={copyUpi} aria-label="Copy UPI ID">
                      {copied ? "Copied ✓" : <><CopyIcon /> Copy</>}
                    </button>
                  </div>
                  <a className="support-upi-pay" href={upiLink(SUPPORT.upi)}>Open UPI app on phone →</a>
                </section>
              )}
            </div>

            {!hasPrimary && !hasUpi && (
              <p className="support-note">Support links coming soon.</p>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
