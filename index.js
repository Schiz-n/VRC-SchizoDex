import readline from "node:readline";
import {
  login,
  verifyTotp,
  verifyEmail,
  getCurrentUser,
  getAllFriends,
  getMutualFriends
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

    // 🔹 get ALL your friends
    const myFriends = await getAllFriends();
    console.log(`Total friends: ${myFriends.length}`);

    // 🔹 pick first 3 friends
    const sample = myFriends.slice(0, 3);

    for (const friend of sample) {
      console.log(`\nFriend: ${friend.displayName}`);

      for (const friend of sample) {
		  console.log(`\nFriend: ${friend.displayName}`);

		  const mutuals = await getMutualFriends(friend.id);

		  console.log(`Mutuals (${mutuals.length}):`);
		  mutuals.forEach(m => {
			console.log(`  - ${m.displayName}`);
		  });
		}


      // mutuals = intersection of IDs
      const myFriendIds = new Set(myFriends.map(f => f.id));
      const mutuals = theirFriends.filter(f =>
        myFriendIds.has(f.id)
      );

      console.log(`Mutuals (${mutuals.length}):`);
      mutuals.forEach(m => {
        console.log(`  - ${m.displayName}`);
      });
    }

  } catch (err) {
    console.error(err.response?.data || err.message);
  } finally {
    rl.close();
  }
})();
