import nodemailer from "nodemailer"

const testAccount=await nodemailer.createTestAccount()

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, 
  auth: {
    user: "alvina.schinner17@ethereal.email",
    pass: "ev25dDcebpPAX7rdD1",
  },
});

export const sendEmail=async({to,subject,html})=>{
   const info=await transporter.sendMail({
        from:`'URL Shortener' <${testAccount.user}>`,
        to,
        subject,
        html,
    });
    const testEmailURL = nodemailer.getTestMessageUrl(info)
    console.log("verify Email:",testEmailURL);
}