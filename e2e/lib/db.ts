// Must be the first import — see e2e/global-setup.ts's comment for why.
import "dotenv/config";

export { closeDbConnection, db } from "@/drizzle";
