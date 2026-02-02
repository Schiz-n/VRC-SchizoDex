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
  const auth = Buffer.from(`${username}:${password}`).toString("base64");

  const res = await client.get("/auth/user", {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  if (!res.data || !res.data.id) {
    throw new Error("Login failed");
  }

  return res.data;
}

export async function getFriends() {
  const res = await client.get("/auth/user/friends", {
    params: {
      n: 100, // max per page
      offset: 0,
    },
  });

  return res.data;
}
