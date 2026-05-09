// Wompi widget runs on https://checkout.wompi.co; the redirect lands back on
// our origin. The webhook is server→server (no browser CORS). The
// create-order function is browser-callable, so it needs CORS headers.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
