import { z } from "zod";

// Runs in the browser before any app code. Zod compiles schemas with `new Function` when it can,
// which the security policy forbids (and reports on every page); it decides while the schemas
// are defined, so this must come first. Without it Zod checks the same way, a little slower.
z.config({ jitless: true });
