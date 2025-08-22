//using sendgrid for email
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send verification email upon successful signup
 * @param {*} to recipient email
 * @param {*} verifyUrl verification url
 */
const sendVerificationEmail = async (to, verifyUrl) => {
  try {
    const msg = {
      to,
      from: process.env.FROM_EMAIL,
      subject: "Verify your WellMesh account",
      // templateId: process.env.WELCOME_TEMPLATE_ID,
      // dynamicTemplateData: {
      //   name: recipient.name,
      //   email: recipient.email,
      // },
      text: `Click this link to verify your account: ${verifyUrl}`,
      html: `<p>Please <a href="${verifyUrl}">click here</a> to verify your account.<br/>Link expires in 24 hours.</p>`,
    };
    await sgMail.send(msg);
  } catch (error) {
    console.error("Error sending verification email:", error);
    if (error.response) {
      console.error(error.response.body);
    }
  }
};

/**
 * Send a confirmation email for event registration with event details
 * @param {*} to recipient email
 * @param {*} event event details
 */
const sendEventRegistrationEmail = async (to, event) => {
  try {
    const msg = {
      to,
      from: process.env.FROM_EMAIL,
      subject: "Event Registration with WellMesh",
      text: `You have successfully registered for the event: ${event.title}`,
      html: `<p>You have successfully registered for the event: ${event.title}</p>`,
      // templateId: process.env.WELCOME_TEMPLATE_ID,
      // dynamicTemplateData: {
      //   name: recipient.name,
      //   email: recipient.email,
      // },
    };
    console.log("Event Registration Email sent to ", to);
    await sgMail.send(msg);
  } catch (error) {
    console.error("Error sending event registration email:", error);
    if (error.response) {
      console.error(error.response.body);
    }
  }
};

/**
 * Send a confirmation email that event registration has been cancelled
 * @param {*} to recipient email array
 * @param {*} event event details
 */
const sendEventCancelledEmail = async (to, event) => {
  try {
    for (const recipient of to) {
      const msg = {
        to,
        from: process.env.FROM_EMAIL,
        subject: "Event cancelled from WellMesh",
        text: `We are sorry to inform you registration has been cancelled for the event: ${event.title}`,
        html: `<p>We are sorry to inform you registration has been cancelled for the event: ${event.title}</p>`,
        // templateId: process.env.WELCOME_TEMPLATE_ID,
        // dynamicTemplateData: {
        //   name: recipient.name,
        //   email: recipient.email,
        // },
      };
      await sgMail.send(msg);
      console.log("Event Cancellation Email sent to ", recipient);
    }
  } catch (error) {
    console.error("Error sending event cancellation emails:", error);
    if (error.response) {
      console.error(error.response.body);
    }
  }
};

module.exports = {
  sendVerificationEmail,
  sendEventRegistrationEmail,
  sendEventCancelledEmail,
};
