const nodemailer = require("nodemailer");

const { AUTH_EMAIL, AUTH_PASS } = process.env;
let transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  secure: false,
  auth: {
    user: AUTH_EMAIL,
    pass: AUTH_PASS,
  },
});

const initializeTransporter = () => {
  transporter.verify((error, success) => {
    if (error) {
      console.log("Error verifying transporter:", error);
    } else {
      console.log("Transporter is ready for messages");
    }
  });
};

initializeTransporter();

const sendEmail = async (mailOptions) => {
  try {
    await transporter.sendMail(mailOptions);
    return;
  } catch (error) {
    throw error;
  }
};


module.exports = sendEmail;
