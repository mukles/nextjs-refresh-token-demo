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
    REFRESH_TOKEN_GRACE_SECONDS: "1",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let serverOutput = "";
child.stdout.on("data", (chunk) => (serverOutput += chunk.toString()));
child.stderr.on("data", (chunk) => (serverOutput += chunk.toString()));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function cookieValue(jar, name) {
  return jar.get(name);
}

function applyCookies(response, jar) {
  const values = response.headers.getSetCookie?.() ?? [];
  for (const header of values) {
    const [pair, ...attributes] = header.split(";");
    const separator = pair.indexOf("=");
    const name = pair.slice(0, separator);
    const value = pair.slice(separator + 1);
    const expired = attributes.some((part) => /^\s*Max-Age=0\s*$/i.test(part));
    if (expired || value === "") jar.delete(name);
    else jar.set(name, value);
  }
}

async function request(path, { jar = new Map(), headers, ...init } = {}) {
  const cookie = [...jar].map(([key, value]) => `${key}=${value}`).join("; ");
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
  });
  applyCookies(response, jar);
  return response;
}

async function login(jar, mobile = "01641146789") {
  return request("/auth/verify-otp", {
    jar,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobileNumber: mobile, otp: "123456" }),
  });
}

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
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

  await scenario(
    "rejects missing refresh token and clears cookies",
    async () => {
      const jar = new Map([["access_token", "stale"]]);
      const response = await request("/auth/refresh", { jar, method: "POST" });
      assert(response.status === 401, `expected 401, got ${response.status}`);
      assert(jar.size === 0, "stale cookies were not cleared");
    },
  );

  await scenario("rejects an invalid OTP", async () => {
    const response = await request("/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobileNumber: "01641146789", otp: "000000" }),
    });
    assert(response.status === 401, `expected 401, got ${response.status}`);
  });

  await scenario("issues an authenticated cookie session", async () => {
    const jar = new Map();
    assert((await login(jar)).status === 200, "login failed");
    assert(cookieValue(jar, "access_token"), "access cookie missing");
    assert(cookieValue(jar, "refresh_token"), "refresh cookie missing");
    assert(
      (await request("/students/profile", { jar })).status === 200,
      "protected profile failed",
    );
  });

  await scenario("refreshes after access-token expiry", async () => {
    const jar = new Map();
    await login(jar);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    assert(
      (await request("/students/profile", { jar })).status === 401,
      "expired access token was accepted",
    );
    assert(
      (await request("/auth/refresh", { jar, method: "POST" })).status === 200,
      "valid refresh token was rejected",
    );
    assert(
      (await request("/students/profile", { jar })).status === 200,
      "refreshed access token was rejected",
    );
  });

  await scenario("detects replay of a rotated refresh token", async () => {
    const jar = new Map();
    await login(jar);
    const stolenRefresh = cookieValue(jar, "refresh_token");
    assert(
      (await request("/auth/refresh", { jar, method: "POST" })).status === 200,
      "first rotation failed",
    );
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const replayJar = new Map([["refresh_token", stolenRefresh]]);
    assert(
      (await request("/auth/refresh", { jar: replayJar, method: "POST" }))
        .status === 401,
      "replayed refresh token was accepted",
    );
    assert(
      (await request("/students/profile", { jar })).status === 401,
      "replay did not revoke the token family",
    );
  });

  await scenario("allows only the newest device session", async () => {
    const deviceA = new Map();
    const deviceB = new Map();
    await login(deviceA);
    await login(deviceB);
    assert(
      (await request("/students/profile", { jar: deviceA })).status === 401,
      "older device remained active",
    );
    assert(
      (await request("/students/profile", { jar: deviceB })).status === 200,
      "newest device was rejected",
    );
  });

  await scenario("makes concurrent refresh requests idempotent", async () => {
    const jar = new Map();
    await login(jar);
    const cookie = `refresh_token=${cookieValue(jar, "refresh_token")}`;
    const [first, second] = await Promise.all([
      fetch(`${baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { Cookie: cookie },
      }),
      fetch(`${baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { Cookie: cookie },
      }),
    ]);
    assert(
      first.status === 200 && second.status === 200,
      `expected 200/200, got ${first.status}/${second.status}`,
    );
    const firstJar = new Map();
    const secondJar = new Map();
    applyCookies(first, firstJar);
    applyCookies(second, secondJar);
    assert(
      cookieValue(firstJar, "refresh_token") ===
        cookieValue(secondJar, "refresh_token"),
      "concurrent requests did not receive the same replacement token",
    );
    jar.set("access_token", cookieValue(firstJar, "access_token"));
    jar.set("refresh_token", cookieValue(firstJar, "refresh_token"));
    assert(
      (await request("/students/profile", { jar })).status === 200,
      "concurrent refresh revoked the valid session",
    );
  });

  await scenario(
    "logout invalidates both access and refresh tokens",
    async () => {
      const jar = new Map();
      await login(jar);
      const oldJar = new Map(jar);
      assert(
        (await request("/auth/logout", { jar, method: "POST" })).status === 200,
        "logout failed",
      );
      assert(jar.size === 0, "logout did not clear cookies");
      assert(
        (await request("/students/profile", { jar: oldJar })).status === 401,
        "old access token survived logout",
      );
      assert(
        (await request("/auth/refresh", { jar: oldJar, method: "POST" }))
          .status === 401,
        "old refresh token survived logout",
      );
    },
  );

  await scenario("rejects an expired refresh token", async () => {
    const jar = new Map();
    await login(jar, "01700000000");
    await new Promise((resolve) => setTimeout(resolve, 4100));
    assert(
      (await request("/auth/refresh", { jar, method: "POST" })).status === 401,
      "expired refresh token was accepted",
    );
    assert(jar.size === 0, "expired-session cookies were not cleared");
  });

  process.stdout.write(`\n${results.length} auth scenarios passed.\n`);
} finally {
  child.kill("SIGTERM");
}
