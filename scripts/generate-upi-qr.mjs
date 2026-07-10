// Generate a scannable UPI QR PNG from the SUPPORT.upi config.
// Run whenever the UPI ID changes:  node scripts/generate-upi-qr.mjs
import QRCode from "qrcode";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { SUPPORT, upiLink } from "../frontend/src/lib/support.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, "..", "frontend", "public", "upi-qr.png");

if (!SUPPORT.upi?.id) { console.error("No UPI id set in support.js"); process.exit(1); }

const uri = upiLink(SUPPORT.upi);
await QRCode.toFile(out, uri, {
  width: 640,
  margin: 2,
  errorCorrectionLevel: "M",
  color: { dark: "#0a403d", light: "#ffffffff" },
});
console.log("UPI QR written →", out);
console.log("encodes:", uri);
