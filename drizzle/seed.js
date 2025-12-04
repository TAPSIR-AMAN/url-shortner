import { reset,seed } from "drizzle-seed";
import * as schemas from "./schema.js";
import { db } from "../config/db.js";


// await reset(db,schemas);
const USER_ID = 1;

await reset(db, {
  shortLink: schemas.shortLink,
});

await seed(
  db,
  {shortLink: schemas.shortLink,},
  { count: 100 }
).refine((f) => ({
  shortLink: {
    columns: {
      userId: f.default({ defaultValue: USER_ID }),
      url: f.default({
        defaultValue: "https://thapatechnical.shop/",
      }),
    },
  },
}));

process.exit(0);