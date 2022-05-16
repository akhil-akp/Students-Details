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
    //   return 1;
    // }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,

      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(subject) {
    const text = `Hey!! ${this.firstName} your most welcome!!\nYou can get your details here:${this.url}`;
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      text,
    };

    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('Welcome ,Now you can access the school functionalities!!');
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
//       pass: process.env.EMAIL_PASSWORD,
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
