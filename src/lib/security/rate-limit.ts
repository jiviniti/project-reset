import { checkRateLimit } from "@vercel/firewall";

export async function isSubmissionRateLimited(request: Request): Promise<boolean> {
  if (!process.env.VERCEL) return false;
  const { rateLimited } = await checkRateLimit("reset-submissions", { request });
  return rateLimited;
}
