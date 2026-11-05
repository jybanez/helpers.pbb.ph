import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const original=fs.readFileSync('tests/glb.data.regression.mjs','utf8');
// The original 1.5m aggregate fixture sits between 128 and 144 MiB: move only
// that over-budget control above 144, retaining the same malformed/sparse cases.
const candidate=original.replace("'../js/ui/ui.glb.data.js'","'./data144.js'").replaceAll("'./fixtures/","'../../tests/fixtures/").replaceAll('/128 MiB/','/144 MiB/').replace('scene(1500000)','scene(1700000)');
const target='output/glb-budget-benchmark/validation144.mjs';fs.writeFileSync(target,candidate);
execFileSync(process.execPath,[target],{stdio:'inherit'});
