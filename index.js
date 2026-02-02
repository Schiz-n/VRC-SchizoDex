import readline from "node:readline";
import {
  login,
  verifyTotp,
  verifyEmail,
  getCurrentUser,
  getAllFriends,
  getMutualFriends
} from "./vrchat.js";
import fs from "node:fs";

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
    
		
	const snapshot = {
	  runAt: Date.now(),
	  friends: new Map(),
	  mutuals: new Map()
	};

	// register friends
	for (const f of myFriends) {
	  snapshot.friends.set(f.id, {
		id: f.id,
		displayName: f.displayName
	  });
	}

	// collect mutuals
	for (const friend of myFriends) {
	  console.log(`Fetching mutuals for ${friend.displayName}...`);

	  const mutuals = await getMutualFriends(friend.id);
	  const set = new Set();

	  for (const m of mutuals) {
		if (!m.id) continue; // skip "Hidden Mutual"
		set.add(m.id);

		// also register mutual user if missing
		if (!snapshot.friends.has(m.id)) {
		  snapshot.friends.set(m.id, {
			id: m.id,
			displayName: m.displayName
		  });
		}
	  }

	  snapshot.mutuals.set(friend.id, set);
	}
	console.log(`Friends tracked: ${snapshot.friends.size}`);

	const counts = [...snapshot.mutuals.entries()]
	  .map(([id, set]) => ({
		id,
		count: set.size
	  }))
	  .sort((a, b) => b.count - a.count)
	  .slice(0, 10);

	console.log("Top 10 by mutual count:");
	for (const c of counts) {
	  console.log(
		`${snapshot.friends.get(c.id)?.displayName ?? c.id}: ${c.count}`
	  );
	}


	function snapshotToJson(snapshot) {
	  return {
		runAt: snapshot.runAt,
		friends: Object.fromEntries(snapshot.friends),
		mutuals: Object.fromEntries(
		  [...snapshot.mutuals.entries()].map(
			([k, v]) => [k, [...v]]
		  )
		)
	  };
	}

	fs.writeFileSync(
	  `snapshot-${snapshot.runAt}.json`,
	  JSON.stringify(snapshotToJson(snapshot), null, 2)
	);

	console.log(`Snapshot written to ${filename}`);

  } catch (err) {
    console.error(err.response?.data || err.message);
  } finally {
    rl.close();
  }
})();
