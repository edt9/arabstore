/**
 * Vercel Serverless Function Entry Point
 *
 * This file is the ONLY entry point for all backend API requests on Vercel.
 * It imports the Express app and exports it as the default handler.
 *
 * On Vercel:
 *  - NO app.listen() is called
 *  - NO filesystem writes (read-only fs)
 *  - NO Vite imports (dev-only)
 *  - Vercel wraps the Express app automatically via @vercel/node
 *
 * Locally (npm run dev):
 *  - tsx runs this file directly
 *  - The `if (!process.env.VERCEL)` block starts the server with Vite middleware
 */
import 'dotenv/config';
import app from '../server/app';
import { isSupabaseConfigured }   from '../server/services/supabase.service';
import { isCloudinaryConfigured } from '../server/services/cloudinary.service';

// ─── Local Development Server ─────────────────────────────────────────────────
// This block is NEVER executed on Vercel (VERCEL env var is set by the platform)
if (!process.env.VERCEL) {
  const PORT = Number(process.env.PORT) || 3000;

  (async () => {
    if (process.env.NODE_ENV !== 'production') {
      // Dynamic import prevents Vite/Rollup from being bundled in production
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      // Local production preview: serve the built React app
      const path    = await import('path');
      const express = await import('express');
      const distPath = path.default.join(process.cwd(), 'dist');
      app.use(express.default.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.default.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n✅ Server running on http://localhost:${PORT}`);
      console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Supabase : ${isSupabaseConfigured   ? '🟢 Connected' : '🟡 Local mode'}`);
      console.log(`   Cloudinary: ${isCloudinaryConfigured ? '🟢 Connected' : '🟡 Not configured'}`);
    });
  })();
}

// ─── Vercel handler ───────────────────────────────────────────────────────────
// Vercel automatically detects the default export and uses it as the handler
export default app;
