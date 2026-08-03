// Entrée pour Vercel : toutes les routes sont réécrites vers cette fonction
// (voir vercel.json), qui délègue à l'app Hono.
import { handle } from "hono/vercel";

import app from "../src/app";

export default handle(app);
