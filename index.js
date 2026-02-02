import { login, getFriends } from "./vrchat.js";

const USERNAME = process.env.VRC_USERNAME;
const PASSWORD = process.env.VRC_PASSWORD;

if (!USERNAME || !PASSWORD) {
  console.error("Set VRC_USERNAME and VRC_PASSWORD env vars");
  process.exit(1);
}

(async () => {
  try {
    const me = await login(USERNAME, PASSWORD);
    console.log(`Logged in as ${me.displayName}`);

    const friends = await getFriends();
    console.log(`Friends: ${friends.length}`);

    friends.forEach(f => {
      console.log(`- ${f.displayName}`);
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
})();
