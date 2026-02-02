import readline from "node:readline";
import {
  login,
  verifyTotp,
  verifyEmail,
  getCurrentUser,
  getFriends
} from "./vrchat.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = q => new Promise(r => rl.question(q, r));

(async () => {
  try {
    const result = await login(
      process.env.VRC_USERNAME,
      process.env.VRC_PASSWORD
    );

    let user;

    if (result.twoFactor) {
      console.log("2FA required");
      const code = await ask("Enter 2FA code: ");

      if (result.methods.totp) await verifyTotp(code);
      else await verifyEmail(code);

      user = await getCurrentUser();
    } else {
      user = result.user;
    }

    console.log(`Logged in as ${user.displayName}`);

    const friends = await getFriends();
    console.log(`Friends: ${friends.length}`);

  } catch (err) {
    console.error(err.response?.data || err.message);
  } finally {
    rl.close();
  }
})();
