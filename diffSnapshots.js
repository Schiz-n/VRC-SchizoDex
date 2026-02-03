import fs from "node:fs";

function isHidden(snapshot, id) {
  return snapshot.friends.get(id)?.displayName === "Hidden Mutual";
}

function pairKey(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
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

function findNewFriends(oldSnap, newSnap) {
  const added = new Set();
  for (const id of newSnap.friends.keys()) {
    if (!oldSnap.friends.has(id)) {
      added.add(id);
    }
  }
  return added;
}
var newFriends = new Map();
function diffSnapshots(oldSnap, newSnap) {
  const removedMutuals = [];
  const addedMutuals = [];
  const visibilityDisabled = new Set();


  const oldFriends = new Set(oldSnap.friends.keys());
  const addedByMutual = new Map();
  const seenAddedPairs = new Set();
  const seenRemovedPairs = new Set();
  newFriends = findNewFriends(oldSnap, newSnap);




  for (const [friendId, oldSet] of oldSnap.mutuals.entries()) {
    const newSet = newSnap.mutuals.get(friendId) || new Set();
	// Skip people who turned on mutuals
	if (oldSet.size === 0 && newSet.size >= 3) {
	  continue;
	}
	// Skip people who turned off mutuals
	if (oldSet.size > 3 && newSet.size === 0) {
	  visibilityDisabled.add(friendId);
	  continue;
	}



    // removed mutuals
    for (const m of oldSet) {
		  if (visibilityDisabled.has(friendId) || visibilityDisabled.has(m)) continue;
      if (isHidden(oldSnap, m) || isHidden(newSnap, m)) continue;
      if (!newSet.has(m)) {
        const key = pairKey(friendId, m);
if (seenRemovedPairs.has(key)) continue;
seenRemovedPairs.add(key);

removedMutuals.push({ friendId, mutualId: m });
      }
    }

    // collect added mutuals (no filtering yet)
    for (const m of newSet) {
		  if (visibilityDisabled.has(friendId) || visibilityDisabled.has(m)) continue;
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


	for (const [mutualId, friends] of addedByMutual.entries()) {
	  if (friends.length >= VISIBILITY_FLOOD_THRESHOLD) continue;

	  for (const friendId of friends) {
		const key = pairKey(friendId, mutualId);
		// Skip edges caused purely by new friend introduction
if (newFriends.has(friendId) || newFriends.has(mutualId)) {
  continue;
}

		if (seenAddedPairs.has(key)) continue;

		seenAddedPairs.add(key);
		addedMutuals.push({ friendId, mutualId });
	  }
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

if (newFriends.size > 0) {
  console.log("\nNew FRIENDS:");
  for (const id of newFriends) {
    const mutualCount = newSnap.mutuals.get(id)?.size ?? 0;
    console.log(
      `+ ${name(newSnap, id)} (${mutualCount} mutuals)`
    );
  }
}

