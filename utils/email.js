const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config({ path: '../config.env' });

module.exports = class Email {
  constructor(user) {
    this.to = user.email;
    this.firstName = user.name;
    this.from = 'NodeJS TODO App <nodejstodo@todo.com>';
  }

  newTransport() {
    if (process.env.NODE_ENV === 'development') {
      return nodemailer.createTransport({
        host: process.env.ETHERAL_HOST,
        port: process.env.ETHERAL_PORT,
        auth: {
          user: process.env.ETHERAL_USER,
          pass: process.env.ETHERAL_PASSWORD,
        },
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendMail(receiver, subject, text) {
    const details = {
      from: '"Todo or Not To do" <foo@example.com>',
      to: receiver,
      subject,
      text,
      // This part will be completed later on
      html: `<p>${text}</p>`,
    };
    const transporter = this.newTransport();

    await transporter.sendMail(details);
  }
};
