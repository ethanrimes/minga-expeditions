// Test helper: bumps a user's tier to 'gold' AND resets their pending
// completion so the level-up branch of the modal can be exercised.
import { createClient } from '@supabase/supabase-js';
import process from 'node:process';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const email = process.argv[2];
const { data: list } = await supabase.auth.admin.listUsers();
const user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!user) throw new Error('user not found');
await supabase.from('profiles').update({ tier: 'gold', total_distance_km: 720, total_elevation_m: 32000 }).eq('id', user.id);
await supabase
  .from('participations')
  .update({ completion_acknowledged_at: null, tier_at_signup: 'bronze' })
  .eq('user_id', user.id);
console.log('Bumped tier to gold and reset participations.');
