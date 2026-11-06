import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!SUPABASE_URL) throw new Error('SUPABASE_URL is required');
if (!SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const authorization = req.headers.get('Authorization');
  const apiKey = req.headers.get('apikey');
  if (!authorization?.match(/^Bearer\s+\S+$/i) || !apiKey) {
    return jsonResponse({ error: 'Authentication required' }, 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const volumeNumber = (body as { volume_number?: unknown } | null)?.volume_number;
  if (typeof volumeNumber !== 'string' || !/^[a-z0-9][a-z0-9 ._-]{0,99}$/i.test(volumeNumber)) {
    return jsonResponse({ error: 'A valid volume_number is required' }, 400);
  }

  const token = authorization.replace(/^Bearer\s+/i, '');
  const userClient = createClient(SUPABASE_URL, apiKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  const user = authData.user;
  if (authError || !user) return jsonResponse({ error: 'Invalid or expired session' }, 401);

  const { data: profile, error: profileError } = await userClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError) {
    console.error('Profile lookup failed', profileError.message);
    return jsonResponse({ error: 'Could not verify access' }, 500);
  }
  const isPrivileged = ['admin', 'founder', 'owner'].includes(profile?.role ?? '');

  const { data: issue, error: issueError } = await userClient
    .from('magazine_issues')
    .select('id, volume_number, is_published, pdf_storage_path')
    .eq('volume_number', volumeNumber)
    .maybeSingle();
  if (issueError) {
    console.error('Issue lookup failed', issueError.message);
    return jsonResponse({ error: 'Could not look up issue' }, 500);
  }
  if (!issue || (!issue.is_published && !isPrivileged)) {
    return jsonResponse({ error: 'Issue not found' }, 404);
  }

  let hasActiveSubscription = false;
  if (!isPrivileged) {
    const { data: subscriptions, error: subscriptionError } = await userClient
      .from('subscriptions')
      .select('valid_until')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(100);
    if (subscriptionError) {
      console.error('Subscription lookup failed', subscriptionError.message);
      return jsonResponse({ error: 'Could not verify access' }, 500);
    }
    const now = Date.now();
    hasActiveSubscription = (subscriptions ?? []).some((subscription) =>
      subscription.valid_until === null || Date.parse(subscription.valid_until) > now
    );
  }

  let hasPurchasedIssue = false;
  if (!isPrivileged && !hasActiveSubscription) {
    const { data: purchase, error: purchaseError } = await userClient
      .from('issue_purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('issue_id', issue.id)
      .limit(1)
      .maybeSingle();
    if (purchaseError) {
      console.error('Purchase lookup failed', purchaseError.message);
      return jsonResponse({ error: 'Could not verify access' }, 500);
    }
    hasPurchasedIssue = Boolean(purchase);
  }

  if (!isPrivileged && !hasActiveSubscription && !hasPurchasedIssue) {
    return jsonResponse({ error: 'You are not entitled to this issue' }, 403);
  }

  const path = issue.pdf_storage_path;
  if (
    typeof path !== 'string' ||
    !path.startsWith('issues/') ||
    !path.toLowerCase().endsWith('.pdf') ||
    path.includes('..')
  ) {
    return jsonResponse({ error: 'Issue PDF is not configured' }, 404);
  }

  const storageClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: signed, error: signingError } = await storageClient.storage
    .from('magazine-editions')
    .createSignedUrl(path, 60, { download: true });
  if (signingError || !signed?.signedUrl) {
    console.error('Signed URL creation failed', signingError?.message);
    return jsonResponse({ error: 'Could not create download link' }, 500);
  }

  return jsonResponse({ signed_url: signed.signedUrl, expires_in: 60 });
});