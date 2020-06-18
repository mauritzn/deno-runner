import {
  Application,
  Router,
} from "denotrain";

const app = new Application({ port: 3001 });
const router = new Router();

router.get("/", (ctx) => {
  // Returning a string, JSON, Reader or Uint8Array automatically sets
  // Content-Type header and no further router will match
  return new Promise((resolve) => resolve("Hello world!"));
});
router.get("/greet/:name", async (ctx) => {
  return `Hello ${ctx.req.params.name}!`;
});

router.get("/json", (ctx) => {
  // Returning a json
  return { "hello": "world" };
});

// Middleware
app.use((ctx) => {
  console.log(`${ctx.req.original.method} request for: ${ctx.req.path}`);
});

app.use("", router);
await app.run();
