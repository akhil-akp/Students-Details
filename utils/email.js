const nodemailer = require('nodemailer');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Akhilesh Kumar <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    // if ((process.env.NODE_ENV = 'production')) {
    return nodemailer.createTransport({
      service: 'SendinBlue',
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.SENDINBLUE_PASSWORD,
      },
    });
    // }

    // return nodemailer.createTransport({
    //   host: process.env.EMAIL_HOST,
    //   port: process.env.EMAIL_PORT,

    //   auth: {
    //     user: process.env.EMAIL_USERNAME,
    //     pass: process.env.EMAIL_PASSWORD,
    //   },
    // });
  }

  async send(subject, text) {
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      text,
    };

    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send(
      'Welcome ,Now you can access the school functionalities!!',
      `Hey!! ${this.firstName} your most welcome!!\nYou can get your details here:${this.url}`
    );
  }

  async sendResetToken() {
    await this.send(
      'This reset token is valid till 10 minutes only !!',
      `Forgot your password ? Submit PATCH request with your password and passwordConfirm to: ${this.url}.\n If didn't forget the password.Please ignore this email.`
    );
  }

  async sendNotification() {
    await this.send(
      'A new notification has been out !!',
      `A new notification has been out please visit our website to see the details. \nThis is url: ${this.url}`
    );
  }
};
// const sendEmail = async (options) => {
//   //Create transportor
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     // service: 'Gmail',
//     // secure: false,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,l3
//       // user: 'akhileshiseet1996@gmail.com',
//       // pass: 'enterRealPassword',
//     },
//   });

//   //Send email
//   await transporter.sendMail({
//     from: 'Akhilesh Kumar <admin@student.io>',
//     //from: 'akhileshiseet1996@gmail.com',
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//   });
// };
// module.exports = sendEmail;
