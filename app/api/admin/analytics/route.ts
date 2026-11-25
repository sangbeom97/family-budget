import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GA4_PROPERTY_ID = "565827478";
const ANALYTICS_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

type GoogleTokenResponse = {
  access_token?: string;
  accessToken?: string;
  error?: string;
  error_description?: string;
};

async function readGoogleError(response: Response) {
  const body = await response.text();
  try {
    const parsed = JSON.parse(body);
    return parsed.error?.message || parsed.error_description || body;
  } catch {
    return body;
  }
}

async function exchangeVercelToken(vercelToken: string) {
  const projectNumber = process.env.GCP_PROJECT_NUMBER;
  const poolId = process.env.GCP_WORKLOAD_IDENTITY_POOL_ID;
  const providerId = process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID;
  const serviceAccountEmail = process.env.GCP_SERVICE_ACCOUNT_EMAIL;

  if (!projectNumber || !poolId || !providerId || !serviceAccountEmail) {
    throw new Error("Google Cloud 인증 환경변수가 누락되었습니다.");
  }

  const audience = `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`;
  const tokenExchangeBody = new URLSearchParams({
    audience,
    grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
    requested_token_type: "urn:ietf:params:oauth:token-type:access_token",
    scope: "https://www.googleapis.com/auth/cloud-platform",
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    subject_token: vercelToken,
  });

  const exchangeResponse = await fetch("https://sts.googleapis.com/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenExchangeBody,
    cache: "no-store",
  });

  if (!exchangeResponse.ok) {
    throw new Error(`Google STS 토큰 교환 실패: ${await readGoogleError(exchangeResponse)}`);
  }

  const exchanged = (await exchangeResponse.json()) as GoogleTokenResponse;
  if (!exchanged.access_token) {
    throw new Error("Google STS 응답에 액세스 토큰이 없습니다.");
  }

  const impersonationResponse = await fetch(
    `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(serviceAccountEmail)}:generateAccessToken`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${exchanged.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scope: [ANALYTICS_SCOPE],
        lifetime: "3600s",
      }),
      cache: "no-store",
    },
  );

  if (!impersonationResponse.ok) {
    throw new Error(`서비스 계정 토큰 발급 실패: ${await readGoogleError(impersonationResponse)}`);
  }

  const impersonated = (await impersonationResponse.json()) as GoogleTokenResponse;
  if (!impersonated.accessToken) {
    throw new Error("서비스 계정 응답에 accessToken 필드가 없습니다.");
  }

  return impersonated.accessToken;
}

async function runReport(accessToken: string, withDateDimension: boolean) {
  const body = {
    dateRanges: [{ startDate: "29daysAgo", endDate: "today" }],
    metrics: [
      { name: "totalUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
    ],
    ...(withDateDimension
      ? {
          dimensions: [{ name: "date" }],
          orderBys: [{ dimension: { dimensionName: "date" } }],
        }
      : {}),
  };

  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`GA4 보고서 조회 실패: ${await readGoogleError(response)}`);
  }

  return response.json() as Promise<{
    rows?: Array<{
      dimensionValues?: Array<{ value?: string }>;
      metricValues?: Array<{ value?: string }>;
    }>;
  }>;
}

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const accessToken = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

    if (!accessToken) {
      return Response.json({ error: "로그인 인증이 필요합니다." }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return Response.json({ error: "Supabase 환경변수가 설정되지 않았습니다." }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !userData.user) {
      return Response.json({ error: "로그인 인증이 만료되었거나 유효하지 않습니다." }, { status: 401 });
    }

    const { data: isAdmin, error: adminError } = await supabase.rpc("is_jellian_admin");
    if (adminError || isAdmin !== true) {
      return Response.json({ error: "관리자 계정만 접근할 수 있습니다." }, { status: 403 });
    }

    const vercelOidcToken = request.headers.get("x-vercel-oidc-token");
    if (!vercelOidcToken) {
      return Response.json(
        { error: "Vercel OIDC 토큰을 찾을 수 없습니다. Production 배포에서 다시 시도해 주세요." },
        { status: 503 },
      );
    }

    const googleAccessToken = await exchangeVercelToken(vercelOidcToken);
    const [summaryReport, dailyReport] = await Promise.all([
      runReport(googleAccessToken, false),
      runReport(googleAccessToken, true),
    ]);

    const summaryValues = summaryReport.rows?.[0]?.metricValues || [];
    const daily = (dailyReport.rows || []).map((row) => ({
      date: row.dimensionValues?.[0]?.value || "",
      users: Number(row.metricValues?.[0]?.value || 0),
      sessions: Number(row.metricValues?.[1]?.value || 0),
      pageViews: Number(row.metricValues?.[2]?.value || 0),
    }));

    return Response.json(
      {
        summary: {
          totalUsers: Number(summaryValues[0]?.value || 0),
          sessions: Number(summaryValues[1]?.value || 0),
          pageViews: Number(summaryValues[2]?.value || 0),
        },
        daily,
        period: "최근 30일",
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("관리자 GA4 통계 조회 실패:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "GA4 통계를 불러오지 못했습니다." },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
