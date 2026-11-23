'use strict';
// Deterministic four-bar CAD JSON derived from the live mechanism graph.
const fs = require('node:fs');
const path = require('node:path');
const G = require('../graph-engine.js');
const D = require('../discovery.js');
const C = require('../components/parametric.js');
const output = process.argv[2] || 'cad/sample_parts.json';
const graph = G.fromLegacyFourbar(D.BEST_LEGACY);
const assembly = C.bindGraph(graph, {widthMm:14, thicknessMm:5, holeDiameterMm:5, edgeMarginMm:2});
fs.mkdirSync(path.dirname(output), {recursive:true});
fs.writeFileSync(output, JSON.stringify(assembly, null, 2) + '\n');
console.log('Exported ' + assembly.parts.length + ' graph-derived link/hub parts to ' + output);
