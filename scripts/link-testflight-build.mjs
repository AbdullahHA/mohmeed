#!/usr/bin/env node
// Links the most recently uploaded build to a TestFlight beta group
// (default: "Internal Testers") via the App Store Connect API, so testers
// don't have to be re-added to every new build by hand in the dashboard.
//
// Required env vars:
//   ASC_KEY_ID        — App Store Connect API key ID
//   ASC_ISSUER_ID     — App Store Connect API issuer ID
//   ASC_PRIVATE_KEY   — the .p8 private key contents (PEM, including headers)
// Optional:
//   ASC_APP_ID        — numeric App Store Connect app id (falls back to eas.json's submit.production.ios.ascAppId)
//   ASC_GROUP_NAME     — beta group name to link to (default: "Internal Testers")

import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';

const API_BASE = 'https://api.appstoreconnect.apple.com/v1';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function buildJwt({ keyId, issuerId, privateKey }) {
  const header = { alg: 'ES256', kid: keyId, typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: issuerId, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = createSign('sha256')
    .update(signingInput)
    .sign({ key: privateKey, dsaEncoding: 'ieee-p1363' });

  return `${signingInput}.${base64url(signature)}`;
}

async function ascFetch(jwt, path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${path} -> ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function ascPost(jwt, path, payload) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`${path} -> ${res.status}: ${JSON.stringify(body)}`);
  }
}

function resolveAppId() {
  if (process.env.ASC_APP_ID) return process.env.ASC_APP_ID;
  try {
    const easJson = JSON.parse(readFileSync(new URL('../eas.json', import.meta.url), 'utf8'));
    const appId = easJson?.submit?.production?.ios?.ascAppId;
    if (appId) return appId;
  } catch {
    // fall through to error below
  }
  console.error('Could not resolve ASC_APP_ID — set it explicitly or check eas.json');
  process.exit(1);
}

async function main() {
  const keyId = requireEnv('ASC_KEY_ID');
  const issuerId = requireEnv('ASC_ISSUER_ID');
  // Env var UIs often store the key as one line with literal "\n" sequences
  // instead of real newlines — normalize so the PEM parses either way.
  const privateKey = requireEnv('ASC_PRIVATE_KEY').replace(/\\n/g, '\n');
  const appId = resolveAppId();
  const groupName = process.env.ASC_GROUP_NAME || 'Internal Testers';

  const jwt = buildJwt({ keyId, issuerId, privateKey });

  console.log(`Looking up the latest build for app ${appId}...`);
  const builds = await ascFetch(
    jwt,
    `/apps/${appId}/builds?sort=-uploadedDate&limit=1&fields[builds]=version,uploadedDate,processingState`
  );
  const build = builds.data?.[0];
  if (!build) throw new Error('No builds found for this app');
  console.log(`Latest build: id=${build.id} version=${build.attributes.version} state=${build.attributes.processingState}`);

  console.log(`Looking up beta group "${groupName}"...`);
  const groups = await ascFetch(
    jwt,
    `/apps/${appId}/betaGroups?filter[name]=${encodeURIComponent(groupName)}`
  );
  const group = groups.data?.[0];
  if (!group) throw new Error(`Beta group "${groupName}" not found`);
  console.log(`Group id: ${group.id}`);

  console.log(`Linking build ${build.id} to group ${group.id}...`);
  await ascPost(jwt, `/builds/${build.id}/relationships/betaGroups`, {
    data: [{ type: 'betaGroups', id: group.id }],
  });

  console.log(`Done — build ${build.attributes.version} is now linked to "${groupName}".`);
}

main().catch((err) => {
  console.error('link-testflight-build failed:', err.message);
  process.exit(1);
});
