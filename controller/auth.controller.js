import {
    authenticateUser,
    clearSession,
    comparePassword,
    createUser,
    findUserById,
    getAllShortLinks,
    getUserbyemail,
    hashpassword,
    generateRandomToken,
    insertVerifyEmailToken,
    createVerifyEmailLink,
    verifyUserEmailandUpdate,
    findVerificationEmailToken,
    clearVerifyEmailTokens,
    sendNewVerifyEmailLink,
    updateUserByName,
    updateUserPassword,
    createResetPasswordLink,
    findUserByEmail,
    getResetPasswordToken,
    clearResetPasswordToken,
    getUserWithOauthId,
    linkUserWithOauth,
    createUserWithOath
} from "../service/auth.services.js";
import { forgotPasswordSchema, loginUserSchema, registerUserSchema, setPasswordSchema, varifyEmailSchema, verifyPasswordSchema, verifyResetPasswordSchema, verifyUserSchema } from "../validators/auth-validator.js";
import { sendEmail } from "../lid/send_email.js";
import { getHtmlFromMjmlTemplate } from "../lid/get-Html-From-Mjml-Template.js";
import { decodeIdToken, generateCodeVerifier, generateState } from "arctic";
import { OAUTH_EXCHANGE_EXPIRY } from "../config/constants.js";
import { google } from "../lid/oauth/google.js";
import { github } from "../lid/oauth/github.js";



export const getRegisterpage = (req, res) => {
    if (req.user) return res.redirect("/")

    return res.render("./auth/register", { errors: req.flash("errors") })
}
export const postRegisterpage = async (req, res) => {
    if (req.user) return res.redirect("/")
    // const {name,email,password}=req.body;

    const { data, error } = registerUserSchema.safeParse(req.body)

    if (error) {
        const errors = error.issues[0].message
        req.flash("errors", errors);
        return res.redirect("/register")
    }
    const { name, email, password } = data
    const userExists = await getUserbyemail(email)
    if (userExists) {
        req.flash("errors", "user already exists")
        return res.redirect("/register")
    }
    const hashedpassword = await hashpassword(password)
    const [user] = await createUser({ name, email, password: hashedpassword })

    await authenticateUser({ req, res, user, name, email })
    await sendNewVerifyEmailLink({ userId: user.id, email })
    res.redirect('/verify-email');

}
export const getLoginpage = (req, res) => {
    if (req.user) return res.redirect("/")
    return res.render("./auth/login", { errors: req.flash("errors") })

}
export const postLogin = async (req, res) => {
    if (req.user) return res.redirect("/")
    const { data, error } = loginUserSchema.safeParse(req.body)
    if (error) {
        const errors = error.issues[0].message
        req.flash("errors", errors);
        return res.redirect("/login")
    }
    const { email, password } = data

    const user = await getUserbyemail(email)
    if (!user) {
        req.flash("errors", "Invalid Email and Password")
        return res.redirect("/login")

    }
    if (!user.password) {
        // database - hash password
        // if password is null

        req.flash(
            "errors",
            "You have created account using social login. Please login with your provider."
        );

        return res.redirect("/login");
    }


    const isPasswordValid = await comparePassword(password, user.password)


    if (!isPasswordValid) {
        req.flash("errors", "Invalid Email and Password")
        return res.redirect("/login");
    }

    await authenticateUser({ req, res, user })
    res.redirect('/');

}

export const getme = (req, res) => {
    if (!req.user) return res.send("not logged in");
    return res.send(`<h1>Hey ${req.user.name}-${req.user.email} `)
}

export const loggedoutuser = async (req, res) => {
    await clearSession(req.user.sessionId)

    res.clearCookie("access_token")
    res.clearCookie("Refresh_token")
    return res.redirect('/login')
}

export const getProfilePage = async (req, res) => {
    if (!req.user) return res.send("not logged in");
    const user = await findUserById(req.user.id);
    if (!user) return res.redirect("/login");

    const usersShortlink = await getAllShortLinks(user.id)

    return res.render("auth/profile", {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            haspassword:Boolean(user.password),
            avatarUrl:user.avatarUrl,
            links: usersShortlink,
            isEmailValid: user.isEmailValid,
        }
    })
}

export const getVerifyEmailPage = async (req, res) => {
    if (!req.user) return res.redirect("/");
    const user = await findUserById(req.user.id)
    if (!user || user.isEmailValid) return res.redirect("/")

    return res.render("auth/verify_email", { email: req.user.email })
}
export const resendVerificationLink = async (req, res) => {
    if (!req.user) return res.redirect("/");
    const user = await findUserById(req.user.id)
    if (!user || user.isEmailValid) return res.redirect("/")

    await sendNewVerifyEmailLink({ userId: req.user.id, email: req.user.email, })

    res.redirect("/verify-email")
}
export const verifyEmailToken = async (req, res) => {
    const { data, error } = varifyEmailSchema.safeParse(req.query)
    if (error) {
        return res.send("verification link expired!")
    }

    // const token = await findVerificationEmailToken(data);
    const [token] = await findVerificationEmailToken(data);

    console.log("🚀 ~ verifyEmailToken ~ token:", token);
    if (!token) res.send("Verification link invalid or expired!");

    await verifyUserEmailandUpdate(token.email)

    clearVerifyEmailTokens(token.userId).catch(console.log(error))

    return res.redirect("/profile")
}
export const getEditProfilePage = async (req, res) => {
    if (!req.user) return res.redirect("/");

    const user = await findUserById(req.user.id);
    if (!user) return res.status(404).send("User not found");

    return res.render("auth/edit-profile", {
        name: user.name,
        avatarUrl:user.avatarUrl,
        errors: req.flash("errors"),
    });

}

export const postEditProfile = async (req, res) => {
    if (!req.user) return res.redirect("/");
    const { data, error } = verifyUserSchema.safeParse(req.body)
    if (error) {
        const errors = error.issues[0].message
        req.flash("errors", errors);
        return res.redirect("/edit-profile")
    }

    // await updateUserByName({ userId: req.user.id, name: data.name })
    const fileUrl = req.file? `uploads/avatar/${req.file.filename}`: undefined;

    await updateUserByName({ userId: req.user.id, name: data.name,avatarUrl:fileUrl })
    return res.redirect("/profile")
}
export const getChangePasswordPage = async (req, res) => {
    if (!req.user) return res.redirect("/");
    return res.render("auth/change-password", {
        errors: req.flash("errors")
    })

}
export const postChangePassword = async (req, res) => {
    const { data, error } = verifyPasswordSchema.safeParse(req.body);
    if (error) {
        const errorMessages = error.issues.map((err) => err.message);
        req.flash("errors", errorMessages);
        return res.redirect("/change-password");
    }
    const { currentPassword, newPassword } = data;
    const user = await findUserById(req.user.id);
    if (!user) return res.status(404).send("User not found");

    const isPasswordValid = await comparePassword(currentPassword, user.password);

    if (!isPasswordValid) {
        req.flash("errors", "Current Password that you entered is invalid");
        return res.redirect("/change-password");
    }
    await updateUserPassword({ userId: user.id, newPassword })
    return res.redirect("/profile");
};

export const getResetPasswordPage = async (req, res) => {
    return res.render("auth/forgot-password", {
        formSubmitted: req.flash("formSubmitted")[0],
        errors: req.flash("errors"),
    });

}
export const postforgetpassword = async (req, res) => {
    const { data, error } = forgotPasswordSchema.safeParse(req.body)
    if (error) {
        const errorMessages = error.issues.map((err) => err.message);
        req.flash("errors", errorMessages[0]);
        return res.redirect("/reset-password");
    }
    const user = await findUserByEmail(data.email);

    if (user) {
        const resetPasswordLink = await createResetPasswordLink({ userId: user.id });
        const html = await getHtmlFromMjmlTemplate("reset-password-email", {
            name: user.name,
            link: resetPasswordLink,
        });
        sendEmail({
            to: user.email,
            subject: "Reset Your Password",
            html,
        });
        req.flash("formSubmitted", true)
    }
    return res.redirect("/reset-password")

}

export const getResetPasswordTokenPage = async (req, res) => {
    const { token } = req.params;

    const passwordResetData = await getResetPasswordToken(token);

    if (!passwordResetData)
        return res.render("auth/wrong-reset-password-token");

    return res.render("auth/reset-password", {
        formSubmitted: req.flash("formSubmitted")[0],
        errors: req.flash("errors"),
        token,
    });
};

export const postResetPasswordToken = async (req, res) => {
    const { token } = req.params;

    const passwordResetData = await getResetPasswordToken(token);

    if (!passwordResetData) {
        req.flash("errors", "Password Token is not matching");
        return res.render("auth/wrong-reset-password-token");
    }


    const { data, error } = verifyResetPasswordSchema.safeParse(req.body);

    if (error) {
        const errorMessages = error.issues.map((err) => err.message);
        req.flash("errors", errorMessages[0]);
        return res.redirect(`/reset-password/${token}`);
    }
    const { newPassword } = data;

    const user = await findUserById(passwordResetData.userId);

    await clearResetPasswordToken(user.id);

    await updateUserPassword({ userId: user.id, newPassword });

    return res.redirect("/login");

};
export const getGoogleLoginPage = async (req, res) => {
    if (req.user) return res.redirect("/");
    const state = generateState();
    const codeVerifier = generateCodeVerifier();

    const url = google.createAuthorizationURL(state, codeVerifier, [
        "openid",   // this is called scopes, here we are giving openid and profile
        "profile",  // openid gives tokens if needed, and profile gives user information
        "email",    // we are telling google about the information that we require from email
    ]);
    const cookieConfig = {
        httpOnly: true,
        secure: true,
        maxAge: OAUTH_EXCHANGE_EXPIRY,
        sameSite: "lax",
    };

    res.cookie("google_oauth_state", state, cookieConfig);
    res.cookie("google_code_verifier", codeVerifier, cookieConfig);

    res.redirect(url.toString());

};
export const getGoogleLoginCallback = async (req, res) => {
    // google redirects with code, and state in query params
    // we will use code to find out the user
    const { code, state } = req.query;
    console.log(code, state);
    const {
        google_oauth_state: storedState,
        google_code_verifier: codeVerifier,
    } = req.cookies;
    if (
        !code || !state || !storedState || !codeVerifier || state !== storedState
    ) {
        req.flash(
            "errors",
            "Couldn't login with Google because of invalid login attempt. Please try again!"
        );

        return res.redirect("/login");
    }
    let tokens;

    try {
        // arctic will verify the code given by google with code verifier internally
        tokens = await google.validateAuthorizationCode(code, codeVerifier);
    } catch {
        req.flash(
            "errors",
            "Couldn't login with Google because of invalid login attempt. Please try again!"
        );
        return res.redirect("/login");
    }

    console.log("token google: ", tokens);

    const claims = decodeIdToken(tokens.idToken());

    const { sub: googleUserId, name, email,picture } = claims;

    let user = await getUserWithOauthId({
        provider: "google",
        email,
    });
    if (user && !user.providerAccountId) {
        await linkUserWithOauth({
            userId: user.id,
            provider: "google",
            providerAccountId: googleUserId,
            avatarUrl:picture,
        });
    }
    if (!user) {
        user = await createUserWithOath({
            name,
            email,
            provider: "google",
            providerAccountId: googleUserId,
            avatarUrl:picture,
        });
    }
    await authenticateUser({ req, res, user, name, email });
    res.redirect("/");
};


export const getGithubLoginPage = async (req, res) => {
    if (req.user) return res.redirect("/");

    const state = generateState();

    const url = github.createAuthorizationURL(state, ["user:email"]);
    const cookieConfig = {
        httpOnly: true,
        secure: true,
        maxAge: OAUTH_EXCHANGE_EXPIRY,
        sameSite: "lax",
    };

    res.cookie("github_oauth_state", state, cookieConfig);

    return res.redirect(url.toString());
};
export const getGithubLoginCallback = async (req, res) => {
    const { code, state } = req.query;
    const { github_oauth_state: storedState } = req.cookies;

    function handleFailedLogin() {
        req.flash(
            "errors",
            "Couldn't login with GitHub because of invalid login attempt. Please try again."
        );
        return res.redirect("/login");
    }
    if (!code || !state || !storedState || state !== storedState) {
        return handleFailedLogin();
    }

    let tokens;
    try {
        tokens = await github.validateAuthorizationCode(code);
    } catch {
        return handleFailedLogin();
    }
    const githubUserResponse = await fetch("https://api.github.com/user", {
        headers: {
            Authorization: `Bearer ${tokens.accessToken()}`,
        },
    });

    if (!githubUserResponse.ok) return handleFailedLogin();

    const githubUser = await githubUserResponse.json();
    console.log(githubUser);
    
    const { id: githubUserId, name ,avatar_url} = githubUser;
    const githubEmailResponse = await fetch(
        "https://api.github.com/user/emails",
        {
            headers: {
                Authorization: `Bearer ${tokens.accessToken()}`,
            },
        }
    );

    if (!githubEmailResponse.ok) return handleFailedLogin();

    const emails = await githubEmailResponse.json();
    const email = emails.filter((e) => e.primary)[0]?.email;

    if (!email) return handleFailedLogin();

    let user = await getUserWithOauthId({
        provider: "github",
        email,
    });

    if (user && !user.providerAccountId) {
        await linkUserWithOauth({
            userId: user.id,
            provider: "github",
            providerAccountId: githubUserId,
            avatarUrl:avatar_url,
        });
    }
    if (!user) {
        user = await createUserWithOath({
            name,
            email,
            provider: "github",
            providerAccountId: githubUserId,
            avatarUrl:avatar_url,
        });
    }
      await authenticateUser({ req, res, user, name, email });

  res.redirect("/");
}
export const getSetPasswordPage = async (req, res) => {
  if (!req.user) return res.redirect("/");

  return res.render("auth/set-password", {
    errors: req.flash("errors"),
  });
};
export const postSetPassword = async (req, res) => {
  if (!req.user) return res.redirect("/");

  const { data, error } = setPasswordSchema.safeParse(req.body);

  if (error) {
    const errorMessages = error.issues.map((err) => err.message);
    req.flash("errors", errorMessages);
    return res.redirect("/set-password");
  }

    const { newPassword } = data;

  const user = await findUserById(req.user.id);
  if (user.password) {
    req.flash(
      "errors",
      "You already have your Password, Instead change your password"
    );
    return res.redirect("/set-password");
  }

    await updateUserPassword({ userId: req.user.id, newPassword });
    return res.redirect("/profile")
}