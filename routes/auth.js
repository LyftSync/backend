import { register, login } from "../controllers/auth.js";

export async function authRouter(req) {
  const url = new URL(req.url);
  if (req.method === "POST" && url.pathname === "/auth/register") {
    return await register(req);
  }
  if (req.method === "POST" && url.pathname === "/auth/login") {
    return await login(req);
  }
  return null;
}
