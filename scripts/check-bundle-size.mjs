#!/usr/bin/env node

/**
 * Simple bundle size check (gzip) for Next.js output
 * - Checks client chunks under apps/web/.next/static
 * - Fails if entry bundle exceeds thresholds
 */

import fs from 'fs';
import path from 'path';
import { createGzip } from 'zlib';
import { pipeline } from 'stream';
import { promisify } from 'util';

const pipe = promisify(pipeline);

const ROOT = process.cwd();
const NEXT_STATIC = path.join(ROOT, 'apps/web/.next/static');

const THRESHOLDS = {
  entryGzipKB: 200, // initial bundle
  pageExtraGzipKB: 100, // per-page additional
};

function listFilesRecursive(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...listFilesRecursive(p));
    else files.push(p);
  }
  return files;
}

async function gzipSize(filePath) {
  const src = fs.createReadStream(filePath);
  const gz = createGzip();
  let bytes = 0;
  gz.on('data', (chunk) => (bytes += chunk.length));
  await pipe(src, gz);
  return bytes; // bytes of gzipped stream
}

function isJs(p) {
  return /\.js$/.test(p) && !/\.map$/.test(p);
}

function classify(files) {
  const entries = files.filter((p) => /framework-|main-|app-|pages-/.test(p));
  const chunks = files.filter((p) => !entries.includes(p));
  return { entries, chunks };
}

async function run() {
  if (!fs.existsSync(NEXT_STATIC)) {
    console.error('❌ Next.js static output not found:', NEXT_STATIC);
    process.exit(1);
  }

  const all = listFilesRecursive(NEXT_STATIC).filter(isJs);
  const { entries, chunks } = classify(all);

  let entryTotalGzip = 0;
  for (const f of entries) {
    entryTotalGzip += await gzipSize(f);
  }

  const entryKB = Math.round(entryTotalGzip / 1024);
  const okEntry = entryKB <= THRESHOLDS.entryGzipKB;

  console.log(`📦 Entry bundle (gzip): ${entryKB}KB (limit ${THRESHOLDS.entryGzipKB}KB)`);

  // Page-level chunks: report top offenders (informational)
  const perFile = [];
  for (const f of chunks) {
    const size = await gzipSize(f);
    perFile.push({ file: f, kb: Math.round(size / 1024) });
  }
  perFile.sort((a, b) => b.kb - a.kb);
  const offenders = perFile.slice(0, 10);
  console.log('Top chunks (gzip KB):');
  offenders.forEach((o) => console.log(`  ${o.kb} KB  ${path.relative(ROOT, o.file)}`));

  if (!okEntry) {
    console.error('❌ Entry bundle exceeds gzip limit');
    process.exit(2);
  }

  console.log('✅ Bundle size within limits');
}

run().catch((e) => {
  console.error('❌ Bundle size check failed:', e?.message || e);
  process.exit(3);
});

