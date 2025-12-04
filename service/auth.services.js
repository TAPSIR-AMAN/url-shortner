import { eq, lt, sql, gte, and } from "drizzle-orm"
import { db } from "../config/db.js"
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { sessionsTable, shortLink, usersTable, verifyEmailTokensTablw, passwordResetTokenTable, oauthAccountsTable } from "../drizzle/schema.js"
// import bcrypt from "bcryptjs";
import argon2 from "argon2"
import jwt from "jsonwebtoken"
import { ACCESS_TOKEN_EXPIRY, MILLISECONDS_PER_SECOND, REFRESH_TOKEN_EXPIRY } from "../config/constants.js"
// import { sendEmail } from "../lid/nodemailer.js";
import { sendEmail } from "../lid/send_email.js";
import mjml2html from "mjml";
import ejs from "ejs"


export const getUserbyemail = async (email) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email))
  return user;
}
export const createUser = async ({ name, email, password }) => {
  return await db.insert(usersTable).values({ name, email, password }).$returningId()
}
export const hashpassword = async (password) => {
  // return await bcrypt.hash(password,10)
  return await argon2.hash(password)
}
export const comparePassword = async (password, hash) => {
  // return await bcrypt.compare(password,hash)
  return await argon2.verify(hash, password)
}
// export const generateToken=async({id,name,email})=>{
//     return  jwt.sign({id,name,email},process.env.JWT_SECREAT,{
//         expiresIn:"30d",
//     })
// }

export const createSession = async (userId, { ip, userAgent }) => {
  const [session] = await db.insert(sessionsTable).values({ userId, ip, userAgent }).$returningId();
  return session;
}
export const createAccessToken = ({ id, name, email, sessionId }) => {


  return jwt.sign({ id, name, email, sessionId }, process.env.JWT_SECREAT,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND,
      // equivalent to "15m"
    });
};

export const createRefreshToken = (sessionId) => {
  return jwt.sign({ sessionId }, process.env.JWT_SECREAT,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND
    });
};


export const verifyJWTToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECREAT)
}
export const findSessonById = async (sessionId) => {
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId));

  return session;

}
export const findUserById = async (userId) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId))
  return user;
}
export const refreshTokens = async (refreshToken) => {
  try {
    const decodedToken = verifyJWTToken(refreshToken)
    const currentSesson = await findSessonById(decodedToken.sessionId)

    if (!currentSesson || !currentSesson.valid) {
      throw new Error("Invalid sesson");
    }

    const user = await findUserById(currentSesson.userId)
    if (!user) throw new Error("Invalid User")

    const userInfo = {
      id: user.id,
      name: user.name,
      email: user.email,
      isEmailValid: user.isEmailValid,
      sessionId: currentSesson.id
    }
    const newAccessToken = createAccessToken(userInfo)
    const newRefreshToken = createRefreshToken(currentSesson.id)

    return {
      newAccessToken,
      newRefreshToken,
      user: userInfo,
    }


  } catch (error) {
    console.log(error.message);

  }
}

export const clearSession = async (sessionId) => {
  return db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId))

}

export const authenticateUser = async ({ req, res, user, name, email }) => {
  const session = await createSession(user.id, {
    ip: req.clientIp,
    userAgent: req.headers["user-agent"],

  })
  const accessToken = createAccessToken({
    id: user.id,
    name: user.name || name,
    email: user.email || email,
    sessionId: session.id,
    isEmailValid: false,
  })
  const refreshToken = createRefreshToken(session.id)

  const baseConfig = { httpOnly: true, secure: true }
  res.cookie("access_token", accessToken, {
    ...baseConfig,
    maxAge: ACCESS_TOKEN_EXPIRY
  })
  res.cookie("Refresh_token", refreshToken, {
    ...baseConfig,
    maxAge: REFRESH_TOKEN_EXPIRY
  })

}

// getAllShortLinks
export const getAllShortLinks = async (userId) => {
  return await db.select().from(shortLink).where(eq(shortLink.userId, userId))
}

export const generateRandomToken = (digit = 8) => {
  const min = 10 ** (digit - 1);
  const max = 10 ** digit;

  return crypto.randomInt(min, max).toString();
}

export const insertVerifyEmailToken = async ({ userId, token }) => {
  return db.transaction(async (tx) => {
    try {
      await tx.delete(verifyEmailTokensTablw).where(lt(verifyEmailTokensTablw.expiresAt, sql`CURRENT_TIMESTAMP`))

      await tx.delete(verifyEmailTokensTablw).where(eq(verifyEmailTokensTablw.userId, userId))

      return await tx.insert(verifyEmailTokensTablw).values({ userId, token })

    } catch (error) {
      console.error("fail to insert varification token:", error)
      throw new Error("unable to create verification token")
    }
  })
}
export const createVerifyEmailLink = async ({ email, token }) => {

  const url = new URL(`${process.env.FRONTEND_URL}/verify-email-token`)
  url.searchParams.append("token", token)
  url.searchParams.append("email", email)

  return url.toString()
}

// export const findVerificationEmailToken = async ({ email, token }) => {
//   const tokenData = await db.select({
//     userId: verifyEmailTokensTablw.userId,
//     token: verifyEmailTokensTablw.token,
//     expiresAt: verifyEmailTokensTablw.expiresAt
//   }).from(verifyEmailTokensTablw)
//     .where(
//       and(
//         eq(verifyEmailTokensTablw.token, token), gte(verifyEmailTokensTablw.expiresAt, sql`CURRENT_TIMESTAMP`))
//     )
//   if (!tokenData.length) return null
//   const { userId } = tokenData[0]

//   const userData = await db
//     .select({
//       userId: usersTable.id,
//       email: usersTable.email,
//     })
//     .from(usersTable)
//     .where(eq(usersTable.id, userId));

//   if (!userData.length) {
//     return null;
//   }

//   return {
//     userId: userData[0].userId,
//     email: userData[0].email,
//     token: tokenData[0].token,
//     expiresAt: tokenData[0].expiresAt,
//   };

// }
export const findVerificationEmailToken = async ({ email, token }) => {

  return db.select({
    email: usersTable.email,
    userId: usersTable.id,
    token: verifyEmailTokensTablw.token,
    expiresAt: verifyEmailTokensTablw.expiresAt,


  }).from(verifyEmailTokensTablw)
    .where(
      and(
        eq(verifyEmailTokensTablw.token, token),
        gte(verifyEmailTokensTablw.expiresAt,
          sql`CURRENT_TIMESTAMP`), eq(usersTable.email, email))
    ).innerJoin(usersTable, eq(verifyEmailTokensTablw.userId, usersTable.id))

}



export const verifyUserEmailandUpdate = async (email) => {
  return db
    .update(usersTable)
    .set({ isEmailValid: true })
    .where(eq(usersTable.email, email));
}
export const clearVerifyEmailTokens = async (userId) => {
  // const [user] = await db
  //   .select()
  //   .from(usersTable)
  //   .where(eq(usersTable.email, email));

  return await db
    .delete(verifyEmailTokensTablw)
    .where(eq(verifyEmailTokensTablw.userId, userId));
}

export const sendNewVerifyEmailLink = async ({ userId, email }) => {
  const randomToken = generateRandomToken();

  await insertVerifyEmailToken({ userId, token: randomToken })

  const verifyEmailLink = await createVerifyEmailLink({
    email,
    token: randomToken,
  })
  const mjmlTemplate = await fs.readFile(
    path.join(import.meta.dirname, "..", "emails", "verify-email.mjml"), "utf8");

  const filledTemplate = ejs.render(mjmlTemplate, {
    code: randomToken, link: verifyEmailLink
  })
  const htmlOutput = mjml2html(filledTemplate).html;

  sendEmail({
    to: email,
    subject: "Verify your email",
    html: htmlOutput,
  }).catch(console.error);
}

export const updateUserByName = async ({ userId, name ,avatarUrl}) => {
  return db.update(usersTable).set({ name ,avatarUrl}).where(eq(usersTable.id, userId));
}
export const updateUserPassword = async ({ userId, newPassword }) => {
  const newhashedpassword = await hashpassword(newPassword)
  return await db.update(usersTable).set({ password: newhashedpassword }).where(eq(usersTable.id, userId));
}
export const findUserByEmail = async (email) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  return user;
};
export const createResetPasswordLink = async ({ userId }) => {
  const randomToken = crypto.randomBytes(32).toString("hex");

  const tokenHash = crypto
    .createHash("sha256")
    .update(randomToken)
    .digest("hex");

  await db
    .delete(passwordResetTokenTable)
    .where(eq(passwordResetTokenTable.userId, userId));

  await db.insert(passwordResetTokenTable).values({
    userId,
    tokenHash,
  });
  return `${process.env.FRONTEND_URL}/reset-password/${randomToken}`;

};
export const getResetPasswordToken = async (token) => {
  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const [data] = await db
    .select()
    .from(passwordResetTokenTable)
    .where(
      and(
        eq(passwordResetTokenTable.tokenHash, tokenHash),
        gte(passwordResetTokenTable.expiresAt, sql`CURRENT_TIMESTAMP`)
      )
    );

  return data;
};
export const clearResetPasswordToken = async (userId) => {
  return await db
    .delete(passwordResetTokenTable)
    .where(eq(passwordResetTokenTable.userId, userId));
};
export async function getUserWithOauthId({ email, provider }) {
  const [user] = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      isEmailValid: usersTable.isEmailValid,
      providerAccountId: oauthAccountsTable.providerAccountId,
      provider: oauthAccountsTable.provider,
    })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .leftJoin(
      oauthAccountsTable,
      and(
        eq(oauthAccountsTable.provider, provider),
        eq(oauthAccountsTable.userId, usersTable.id)
      )
    );

  return user;
}
export async function linkUserWithOauth({ userId, provider, providerAccountId,avatarUrl }) {
  await db.insert(oauthAccountsTable).values({userId,provider,providerAccountId,});
  if (avatarUrl) {
  await db.update(usersTable).set({ avatarUrl }).where(and(eq(usersTable.id, userId),isNull(usersTable.avatarUrl)));
}

}
export async function createUserWithOath({ name, email, provider, providerAccountId,avatarUrl }) {
  const user = await db.transaction(async (trx) => {
    const [user] = 
    await trx.insert(usersTable).values({email, name,// password: "",
      avatarUrl,isEmailValid: true,
    }).$returningId()

    await trx.insert(oauthAccountsTable).values({ provider, providerAccountId, userId: user.id, });

    return { id: user.id, name, email, isEmailValid: true, provider, providerAccountId, };
  });

  return user;
}
