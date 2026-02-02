import axios from "axios";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";

const jar = new CookieJar();

const client = wrapper(
  axios.create({
    baseURL: "https://api.vrchat.cloud/api/1",
    jar,
    withCredentials: true,
    headers: {
      "User-Agent": "SpiderWeb/0.1 (contact: you)",
    },
  })
);

export async function login(username, password) {
  const auth = Buffer
    .from(`${username}:${password}`)
    .toString("base64");

  const res = await client.get("/auth/user", {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  if (!res.data.requiresTwoFactorAuth) {
    return { user: res.data, twoFactor: false };
  }

  return {
    twoFactor: true,
    methods: {
      totp: res.data.requiresTwoFactorAuthTotp,
      email: res.data.requiresTwoFactorAuthEmail,
    },
  };
}

export async function verifyTotp(code) {
  await client.post(
    "/auth/twofactorauth/totp/verify",
    { code: String(code) },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

export async function verifyEmail(code) {
  await client.post(
    "/auth/twofactorauth/emailotp/verify",
    { code: String(code) },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}



export async function getCurrentUser() {
  const res = await client.get("/auth/user");
  return res.data;
}

export async function getFriends() {
  const res = await client.get("/auth/user/friends", {
    params: { n: 100, offset: 0 },
  });
  return res.data;
}
