import fs from "node:fs";

function isHidden(snapshot, id) {
  return snapshot.friends.get(id)?.displayName === "Hidden Mutual";
}

function loadSnapshot(path) {
  const raw = JSON.parse(fs.readFileSync(path, "utf8"));

  return {
    runAt: raw.runAt,
    friends: new Map(Object.entries(raw.friends)),
    mutuals: new Map(
      Object.entries(raw.mutuals).map(
        ([k, v]) => [k, new Set(v)]
      )
    )
  };
}

function diffSnapshots(oldSnap, newSnap) {
  const removedMutuals = [];
  const addedMutuals = [];

  const oldFriends = new Set(oldSnap.friends.keys());
  const addedByMutual = new Map();

  for (const [friendId, oldSet] of oldSnap.mutuals.entries()) {
    const newSet = newSnap.mutuals.get(friendId) || new Set();
	// Skip friend-side visibility toggles
	if (oldSet.size === 0 && newSet.size >= 5) {
	  continue;
	}

    // removed mutuals
    for (const m of oldSet) {
      if (isHidden(oldSnap, m) || isHidden(newSnap, m)) continue;
      if (!newSet.has(m)) {
        removedMutuals.push({ friendId, mutualId: m });
      }
    }

    // collect added mutuals (no filtering yet)
    for (const m of newSet) {
      if (isHidden(oldSnap, m) || isHidden(newSnap, m)) continue;
      if (!oldSet.has(m)) {
        const arr = addedByMutual.get(m) ?? [];
        arr.push(friendId);
        addedByMutual.set(m, arr);
      }
    }
  }

  // suppress visibility floods
  const VISIBILITY_FLOOD_THRESHOLD = 10;

  for (const [mutualId, friends] of addedByMutual.entries()) {
    if (friends.length >= VISIBILITY_FLOOD_THRESHOLD) {
      // visibility toggle detected
      continue;
    }

    for (const friendId of friends) {
      addedMutuals.push({ friendId, mutualId });
    }
  }

  return { addedMutuals, removedMutuals };
}


function name(snapshot, id) {
  return snapshot.friends.get(id)?.displayName ?? id;
}

const snap1Path = process.env.SNAP1;
const snap2Path = process.env.SNAP2;

if (!snap1Path || !snap2Path) {
  console.error("Please set SNAP1 and SNAP2 environment variables.");
  process.exit(1);
}

const oldSnap = loadSnapshot(snap1Path);
const newSnap = loadSnapshot(snap2Path);

const { addedMutuals, removedMutuals } =
  diffSnapshots(oldSnap, newSnap);

console.log(
  `Comparing ${new Date(oldSnap.runAt).toISOString()} → ${new Date(newSnap.runAt).toISOString()}`
);

// Defriends
if (removedMutuals.length === 0) {
  console.log("No mutuals removed.");
} else {
  console.log("\nMutuals REMOVED:");
  for (const { friendId, mutualId } of removedMutuals) {
    console.log(
      `- ${name(newSnap, friendId)} ↔ ${name(oldSnap, mutualId)}`
    );
  }
}

// New friends
if (addedMutuals.length === 0) {
  console.log("\nNo mutuals added.");
} else {
  console.log("\nMutuals ADDED:");
  for (const { friendId, mutualId } of addedMutuals) {
    console.log(
      `+ ${name(newSnap, friendId)} ↔ ${name(newSnap, mutualId)}`
    );
  }
}
