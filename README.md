# VRC-SchizoDex
It's like a PokéDex but instead you schizophrenically keep track of all of your VRChat friends and whether or not they are still friends lol!

Local snapshot-based tracking tool for **VRChat**.
Periodically pulls your friends records and their mutuals, then fishes out who gained or lost connections.

Vibe coded from start to finish with ChatGPT 5.2 Instant using **[VRCX](https://github.com/vrcx-team/VRCX/)** as a reference for API pulls.

run:

$env:VRC_USERNAME="Name"<br />
$env:VRC_PASSWORD="Pass"<br />
node index.js<br />
-> save the snapshot<br />
-> wait some time<br />
-> snapshot again<br />

$env:SNAP1="snapshot-1770067509019.json"<br />
$env:SNAP2="snapshot-1770068233838.json"<br />
node diffSnapshots.js<br />
