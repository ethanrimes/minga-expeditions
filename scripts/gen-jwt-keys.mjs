import crypto from 'node:crypto';

// Supabase-compatible HS256 JWTs. The same JWT secret must be configured on
// GoTrue (GOTRUE_JWT_SECRET) + PostgREST (PGRST_JWT_SECRET) + Kong so these
// anon/service_role keys validate. iss/ref mirror Supabase's hosted format.
const b64url = (buf) => Buffer.from(buf).toString('base64url');
const sign = (payload, secret) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const data = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
};

const jwtSecret = crypto.randomBytes(48).toString('base64url'); // >= 40 chars
const iat = Math.floor(Date.now() / 1000);
const exp = iat + 60 * 60 * 24 * 365 * 10; // 10 years, like Supabase
const ref = 'minga-azure-dev';

const anon = sign({ role: 'anon', iss: 'supabase', ref, iat, exp }, jwtSecret);
const service = sign({ role: 'service_role', iss: 'supabase', ref, iat, exp }, jwtSecret);

console.log(JSON.stringify({ jwtSecret, anon, service }));
