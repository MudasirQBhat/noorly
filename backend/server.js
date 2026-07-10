import express from "express";
import cors from "cors";
import contentRoutes from "./routes/content.js";
import adminRoutes from "./routes/admin.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// simple request log
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method} ${req.url}`);
  next();
});

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "noorly-api" }));
app.use("/api", contentRoutes);
app.use("/api/admin", adminRoutes);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

app.listen(PORT, () => {
  console.log(`\n  Noorly API listening on http://localhost:${PORT}`);
  console.log(`  → GET /api/duas   /api/duas/:id`);
  console.log(`  → GET /api/surahs /api/surahs/:number\n`);
});
