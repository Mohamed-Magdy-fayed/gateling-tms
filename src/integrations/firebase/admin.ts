import "server-only";

import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { env } from "@/data/env/server";

let app: App | undefined;

function getFirebaseAdmin(): App {
  if (app) return app;

  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
    return app;
  }

  app = initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").replace(
        /\r/g,
        "",
      ),
    }),
    storageBucket: env.FIREBASE_STORAGE_BUCKET,
  });

  return app;
}

export function getStorageBucket() {
  return getStorage(getFirebaseAdmin()).bucket();
}

/**
 * All four credentials present. Every Firebase env var is optional (uploads
 * are dormant until a bucket exists), so background work that walks the
 * bucket has to ask before assuming it can — see the reconciliation function.
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    env.FIREBASE_PROJECT_ID &&
      env.FIREBASE_CLIENT_EMAIL &&
      env.FIREBASE_PRIVATE_KEY &&
      env.FIREBASE_STORAGE_BUCKET,
  );
}
