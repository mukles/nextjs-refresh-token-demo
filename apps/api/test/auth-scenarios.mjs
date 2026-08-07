import { spawn } from "node:child_process";

const port = 3012;
const baseUrl = `http://127.0.0.1:${port}/api/v1`;
const child = spawn(process.execPath, ["dist/main.js"], {
  cwd: new URL("..", import.meta.url),
  env: {
    ...process.env,
    PORT: String(port),
    ACCESS_TOKEN_TTL_SECONDS: "1",
    REFRESH_TOKEN_TTL_SECONDS: "4",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let serverOutput = "";
child.stdout.on("data", (chunk) => (serverOutput += chunk.toString()));
child.stderr.on("data", (chunk) => (serverOutput += chunk.toString()));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The API sets no cookies: tokens travel in the JSON body and come back as
 * `Authorization: Bearer <token>`. A "session" here is just the token pair.
 */
async function request(path, { token, json, ...init } = {}) {
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    ...(json ? { body: JSON.stringify(json) } : {}),
  });
}

function readTokens(payload) {
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
  };
}

let mobileCounter = 0;
function uniqueMobile() {
  mobileCounter += 1;
  return `0171${String(Date.now() % 1_000_00).padStart(5, "0")}${String(
    mobileCounter,
  ).padStart(2, "0")}`.slice(0, 11);
}

/** Registers on first use and signs in afterwards, so runs are DB-independent. */
async function login(mobile = uniqueMobile()) {
  let response = await request("/auth/verify-otp", {
    method: "POST",
    json: { mobileNumber: mobile, otp: "123456", name: "Scenario Student" },
  });
  if (response.status === 400) {
    response = await request("/auth/verify-otp", {
      method: "POST",
      json: { mobileNumber: mobile, otp: "123456" },
    });
  }
  assert(response.status === 200, `login failed (${response.status})`);
  const session = readTokens(await response.json());
  session.mobile = mobile;
  return session;
}

async function rotate(session) {
  const response = await request("/auth/refresh", {
    method: "POST",
    json: { refresh_token: session.refreshToken },
  });
  if (response.ok) Object.assign(session, readTokens(await response.json()));
  return response.status;
}

const profile = (session) =>
  request("/students/profile", { token: session.accessToken });

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch {}
    await sleep(100);
  }
  throw new Error(`API did not start:\n${serverOutput}`);
}

const results = [];
async function scenario(name, run) {
  await run();
  results.push(name);
  process.stdout.write(`✓ ${name}\n`);
}

try {
  await waitForServer();

  await scenario("rejects a refresh with no token presented", async () => {
    const response = await request("/auth/refresh", { method: "POST" });
    assert(response.status === 401, `expected 401, got ${response.status}`);
  });

  await scenario("rejects an unknown refresh token", async () => {
    const response = await request("/auth/refresh", {
      method: "POST",
      json: { refresh_token: "not-a-real-token" },
    });
    assert(response.status === 401, `expected 401, got ${response.status}`);
  });

  await scenario("rejects an invalid OTP", async () => {
    const response = await request("/auth/verify-otp", {
      method: "POST",
      json: { mobileNumber: uniqueMobile(), otp: "000000" },
    });
    assert(response.status === 401, `expected 401, got ${response.status}`);
  });

  await scenario("rejects a request body that fails validation", async () => {
    const missingOtp = await request("/auth/verify-otp", {
      method: "POST",
      json: { mobileNumber: uniqueMobile() },
    });
    assert(
      missingOtp.status === 400,
      `expected 400 for a missing otp, got ${missingOtp.status}`,
    );

    const shortName = await request("/auth/verify-otp", {
      method: "POST",
      json: { mobileNumber: uniqueMobile(), otp: "123456", name: "x" },
    });
    assert(
      shortName.status === 400,
      `expected 400 for a 1-character name, got ${shortName.status}`,
    );
  });

  await scenario("issues a bearer session", async () => {
    const session = await login();
    assert(session.accessToken, "access_token missing");
    assert(session.refreshToken, "refresh_token missing");
    assert(
      (await profile(session)).status === 200,
      "protected profile rejected a fresh access token",
    );
  });

  await scenario("rejects a protected route with no token", async () => {
    const response = await request("/students/profile");
    assert(response.status === 401, `expected 401, got ${response.status}`);
  });

  await scenario("updates the authenticated student profile", async () => {
    const session = await login();
    const update = await request("/students/profile", {
      method: "PATCH",
      token: session.accessToken,
      json: { name: "Updated Student" },
    });
    assert(update.status === 200, `expected 200, got ${update.status}`);
    assert(
      (await update.json()).name === "Updated Student",
      "name was not updated",
    );

    const persisted = await profile(session);
    assert(
      (await persisted.json()).name === "Updated Student",
      "updated name was not persisted",
    );

    const invalid = await request("/students/profile", {
      method: "PATCH",
      token: session.accessToken,
      json: { name: " " },
    });
    assert(invalid.status === 400, `expected 400, got ${invalid.status}`);
  });

  await scenario("refreshes after access-token expiry", async () => {
    const session = await login();
    await sleep(1200);
    assert(
      (await profile(session)).status === 401,
      "expired access token was accepted",
    );
    assert((await rotate(session)) === 200, "valid refresh token was rejected");
    assert(
      (await profile(session)).status === 200,
      "refreshed access token was rejected",
    );
  });

  await scenario("detects replay of a rotated refresh token", async () => {
    const session = await login();
    const stolenRefresh = session.refreshToken;
    assert((await rotate(session)) === 200, "first rotation failed");

    await sleep(10_100); // outlast the concurrent-refresh grace window
    const replay = await request("/auth/refresh", {
      method: "POST",
      json: { refresh_token: stolenRefresh },
    });
    assert(replay.status === 401, "replayed refresh token was accepted");
    assert(
      (await replay.json()).code === "REUSE_DETECTED",
      "replay was not reported as REUSE_DETECTED",
    );
    assert(
      (await rotate(session)) === 401,
      "replay did not revoke the token family",
    );
  });

  await scenario("allows only the newest device session", async () => {
    const deviceA = await login();
    const deviceB = await login(deviceA.mobile);
    const replaced = await profile(deviceA);
    assert(replaced.status === 401, "older device remained active");
    assert(
      (await replaced.json()).code === "SESSION_REPLACED",
      "older device was not told its session was replaced",
    );
    assert((await profile(deviceB)).status === 200, "newest device rejected");
  });

  await scenario("makes concurrent refresh requests idempotent", async () => {
    const session = await login();
    const [first, second] = await Promise.all([
      request("/auth/refresh", {
        method: "POST",
        json: { refresh_token: session.refreshToken },
      }),
      request("/auth/refresh", {
        method: "POST",
        json: { refresh_token: session.refreshToken },
      }),
    ]);
    assert(
      first.status === 200 && second.status === 200,
      `expected 200/200, got ${first.status}/${second.status}`,
    );
    const firstTokens = readTokens(await first.json());
    const secondTokens = readTokens(await second.json());
    assert(
      firstTokens.refreshToken === secondTokens.refreshToken,
      "concurrent requests did not receive the same replacement token",
    );
    assert(
      (await profile(firstTokens)).status === 200,
      "concurrent refresh revoked the valid session",
    );
  });

  await scenario("logout invalidates both tokens", async () => {
    const session = await login();
    const logout = await request("/auth/logout", {
      method: "POST",
      json: { refresh_token: session.refreshToken },
    });
    assert(logout.status === 200, "logout failed");
    assert(
      (await profile(session)).status === 401,
      "old access token survived logout",
    );
    assert(
      (await rotate(session)) === 401,
      "old refresh token survived logout",
    );
  });

  await scenario("rejects an expired refresh token", async () => {
    const session = await login();
    await sleep(4100);
    assert(
      (await rotate(session)) === 401,
      "expired refresh token was accepted",
    );
  });

  await scenario(
    "returns exactly one spelling of each token field",
    async () => {
      const otpRes = await request("/auth/verify-otp", {
        method: "POST",
        json: {
          mobileNumber: uniqueMobile(),
          otp: "123456",
          name: "Bearer Test User",
        },
      });
      assert(otpRes.status === 200, "verify-otp failed");
      const loginData = await otpRes.json();
      assert(loginData.token_type === "Bearer", "token_type Bearer missing");
      assert(loginData.access_token, "access_token missing");
      assert(loginData.refresh_token, "refresh_token missing");
      assert(typeof loginData.expires_in === "number", "expires_in missing");
      for (const alias of ["accessToken", "refreshToken", "tokens"]) {
        assert(!(alias in loginData), `unexpected duplicate field ${alias}`);
      }

      const profileRes = await request("/students/profile", {
        token: loginData.access_token,
      });
      assert(
        profileRes.status === 200,
        `expected 200 with a Bearer header, got ${profileRes.status}`,
      );

      // A Bearer header is NOT how the refresh token is presented.
      const refreshBearer = await request("/auth/refresh", {
        method: "POST",
        token: loginData.refresh_token,
      });
      assert(
        refreshBearer.status === 401,
        `expected 401 for a bearer-only refresh, got ${refreshBearer.status}`,
      );

      const rotatedRes = await request("/auth/refresh", {
        method: "POST",
        json: { refresh_token: loginData.refresh_token },
      });
      assert(rotatedRes.status === 200, "refresh with a JSON body failed");
      const rotated = await rotatedRes.json();
      assert(rotated.access_token, "rotated access_token missing");

      const afterRefresh = await request("/students/profile", {
        token: rotated.access_token,
      });
      assert(
        afterRefresh.status === 200,
        "profile access with the rotated access token failed",
      );

      const refreshJson = await request("/auth/refresh", {
        method: "POST",
        json: { refresh_token: rotated.refresh_token },
      });
      assert(
        refreshJson.status === 200,
        "refresh with a JSON body refresh_token failed",
      );
    },
  );

  await scenario("sets no cookies on any auth response", async () => {
    const response = await request("/auth/verify-otp", {
      method: "POST",
      json: {
        mobileNumber: uniqueMobile(),
        otp: "123456",
        name: "Cookie Free",
      },
    });
    assert(response.status === 200, "verify-otp failed");
    assert(
      (response.headers.getSetCookie?.() ?? []).length === 0,
      "the API set a cookie",
    );
  });

  process.stdout.write(`\n${results.length} auth scenarios passed.\n`);
} finally {
  child.kill("SIGTERM");
}
