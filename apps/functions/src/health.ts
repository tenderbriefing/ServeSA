import * as functions from "firebase-functions/v2/https";

export const health = functions.onRequest((req: any, res: any) => {
  res.status(200).json({ ok: true, service: "servesa", build: process.env.GIT_COMMIT ?? "dev" });
});
