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

export async function getAllFriends() {
  const seen = new Map();

  async function fetch(status) {
    let offset = 0;
    const pageSize = 100;

    while (true) {
      const res = await client.get("/auth/user/friends", {
        params: {
          n: pageSize,
          offset,
          [status]: true
        }
      });

      const batch = res.data;
      for (const f of batch) {
        seen.set(f.id, f); // dedupe by ID
      }

      if (batch.length < pageSize) break;
      offset += pageSize;
    }
  }

  // VRChat requires these as separate passes
  await fetch("online");
  await fetch("offline");

  return [...seen.values()];
}


export async function getMutualFriends(userId) {
  const all = [];
  let offset = 0;
  const pageSize = 50; // VRChat mutual cap

  while (true) {
    const res = await client.get(
      `/users/${userId}/mutuals/friends`,
      {
        params: {
          n: pageSize,
          offset
        }
      }
    );

    const batch = res.data;
    all.push(...batch);

    if (batch.length < pageSize) break;
    offset += pageSize;
  }

  return all;
}


