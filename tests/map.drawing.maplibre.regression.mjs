import { startStaticServer } from "./_support/static-server.mjs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const run = promisify(execFile);
const server = await startStaticServer({ rootDir: process.cwd(), port: 0 });
const cli = command => run(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", `npx --no-install @playwright/cli -s=maplibre-drawing-regression ${command}`], { timeout: 60000, maxBuffer: 2 ** 22 });
try {
  await cli(`open ${server.origin}/demos/demo.map.drawing.html`);
  for (const suffix of ["", "?bundle"]) {
    await cli(`goto ${server.origin}/demos/demo.map.drawing.html${suffix}`);
    const paths = await cli("run-code --filename tests/_support/maplibre-line-path-check.js");
    if (!paths.stdout.includes('### Result\n"LINE_PATH_OK"')) throw Error(paths.stdout);
    console.log(`MapLibre distinct Line/Path and segment translation passed (${suffix || "source"}).`);
    await cli(`goto ${server.origin}/demos/demo.map.drawing.html${suffix}`);
    const segmentHistory = await cli("run-code --filename tests/_support/maplibre-segment-history-check.js");
    if (!segmentHistory.stdout.includes('### Result\n"SEGMENT_HISTORY_OK"')) throw Error(segmentHistory.stdout);
    console.log(`MapLibre segment history/reentrancy passed (${suffix || "source"}).`);
    await cli(`goto ${server.origin}/demos/demo.map.drawing.html${suffix}`);
    const boundary = await cli("run-code --filename tests/_support/maplibre-segment-boundary-check.js");
    if (!boundary.stdout.includes('### Result\n"SEGMENT_BOUNDARY_OK"')) throw Error(boundary.stdout);
    console.log(`MapLibre segment world/Mercator boundaries passed (${suffix || "source"}).`);
    if (suffix === "?bundle") {
      const assets = await cli("run-code --filename tests/_support/maplibre-bundle-assets-check.js");
      if (!assets.stdout.includes('### Result\n"BUNDLE_ASSETS_OK"')) throw Error(assets.stdout);
      console.log("MapLibre exactly three Helper bundle assets passed.");
    }
  }
  for (const suffix of ["?legacy", "?bundle=legacy"]) {
    await cli(`goto ${server.origin}/demos/demo.map.drawing.html${suffix}`);
    const pending = await cli("run-code --filename tests/_support/maplibre-pending-tile-check.js");
    if (!pending.stdout.includes('### Result\n"PENDING_TILE_OK"')) throw Error(pending.stdout);
    console.log(`MapLibre pending tile initialization passed (${suffix || "source"}).`);
    await cli(`goto ${server.origin}/demos/demo.map.drawing.html${suffix}`);
    const modes = await cli("run-code --filename tests/_support/maplibre-clean-mode-check.js");
    if (!modes.stdout.includes('### Result\n"CLEAN_MODE_OK"')) throw Error(modes.stdout);
    console.log(`MapLibre clean edit mode transition passed (${suffix || "source"}).`);
    await cli(`goto ${server.origin}/demos/demo.map.drawing.html${suffix}`);
    const switches = await cli("run-code --filename tests/_support/maplibre-clean-switch-check.js");
    if (!switches.stdout.includes('### Result\n"CLEAN_SWITCH_OK"')) throw Error(switches.stdout);
    console.log(`MapLibre clean edit switching passed (${suffix || "source"}).`);
    await cli(`goto ${server.origin}/demos/demo.map.drawing.html${suffix}`);
    const cleanDelete = await cli("run-code --filename tests/_support/maplibre-clean-delete-check.js");
    if (!cleanDelete.stdout.includes('### Result\n"CLEAN_DELETE_OK"')) throw Error(cleanDelete.stdout);
    console.log(`MapLibre clean edit deletion passed (${suffix || "source"}).`);
    await cli(`goto ${server.origin}/demos/demo.map.drawing.html${suffix}`);
    const { stdout } = await cli("run-code --filename tests/_support/maplibre-drawing-check.js");
    if (!stdout.includes("PASS")) throw Error(stdout);
    console.log(`MapLibre drawing real pointer/keyboard regression passed (${suffix || "source"}).`);
    await cli(`goto ${server.origin}/demos/demo.map.drawing.html${suffix}`);
    const gate = await cli("run-code --filename tests/_support/maplibre-deletion-gate-check.js");
    if (!gate.stdout.includes("PASS")) throw Error(gate.stdout);
    console.log(`MapLibre deletion gate regression passed (${suffix || "source"}).`);
    await cli(`goto ${server.origin}/demos/demo.map.drawing.html${suffix}`);
    const edits = await cli("run-code --filename tests/_support/maplibre-object-edit-check.js");
    if (!edits.stdout.includes('### Result\n"OBJECT_EDIT_OK"')) throw Error(edits.stdout);
    console.log(`MapLibre object edit regression passed (${suffix || "source"}).`);
    await cli(`goto ${server.origin}/demos/demo.map.drawing.html${suffix}`);
    const removal = await cli("run-code --filename tests/_support/maplibre-removal-check.js");
    if (!removal.stdout.includes('### Result\n"REMOVAL_OK"')) throw Error(removal.stdout);
    console.log(`MapLibre lifetime/removal regression passed (${suffix || "source"}).`);
  }
} finally { try { await cli("close"); } finally { await server.close(); } }
