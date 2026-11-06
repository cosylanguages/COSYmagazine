// supabase/functions/get-issue-download-url/index.ts
// Secure Edge Function: Generates short-lived signed URLs for magazine issue PDFs
// Enforces server-side authorization: founder/admin role, active subscription, or issue purchase.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Client using caller's JWT to authenticate user identity
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired session token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse requested issue ID
    const { issue_id } = await req.json();
    if (!issue_id || typeof issue_id !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'issue_id' in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Admin/Service client to perform trusted server-side entitlement checks
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch user role
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = (profile?.role || "").trim().toLowerCase();
    const isFounder = role === "founder" || role === "admin" || role === "owner";

    // 2. Fetch active subscription status
    const { data: sub } = await adminClient
      .from("subscriptions")
      .select("tier, status, valid_until")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    const isSubscribed = !!(sub && (!sub.valid_until || new Date(sub.valid_until) > new Date()));

    // 3. Check individual issue purchase
    const { data: purchase } = await adminClient
      .from("issue_purchases")
      .select("issue_id")
      .eq("user_id", user.id)
      .eq("issue_id", issue_id)
      .maybeSingle();

    const hasPurchasedIssue = !!purchase;

    // Check entitlement
    const hasAccess = isFounder || isSubscribed || hasPurchasedIssue;
    if (!hasAccess) {
      return new Response(
        JSON.stringify({
          error: "Access denied. Active subscription or issue purchase required.",
          tier: isSubscribed ? sub.tier : "free",
          entitled: false,
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Retrieve issue storage path from magazine_issues
    const { data: issueRecord, error: issueErr } = await adminClient
      .from("magazine_issues")
      .select("pdf_storage_path, title, volume_number")
      .eq("id", issue_id)
      .maybeSingle();

    if (issueErr || !issueRecord || !issueRecord.pdf_storage_path) {
      return new Response(
        JSON.stringify({ error: `Issue '${issue_id}' not found or PDF not configured.` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Generate signed URL from private bucket 'magazine-editions' (valid for 60 seconds)
    const { data: signedData, error: signError } = await adminClient.storage
      .from("magazine-editions")
      .createSignedUrl(issueRecord.pdf_storage_path, 60);

    if (signError || !signedData?.signedUrl) {
      return new Response(
        JSON.stringify({ error: "Failed to generate signed download URL." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        issue_id,
        title: issueRecord.title,
        volume_number: issueRecord.volume_number,
        download_url: signedData.signedUrl,
        expires_in: 60,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal Server Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
