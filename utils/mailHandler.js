const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 25,
    secure: false, // Use true for port 465, false for port 587
    auth: {
        user: "",
        pass: "",
    },
});
module.exports = {
    sendMail: async function (to,url) {
        const info = await transporter.sendMail({
            from: 'hehehe@gmail.com',
            to: to,
            subject: "reset password URL",
            text: "click vao day de doi pass", // Plain-text version of the message
            html: "click vao <a href="+url+">day</a> de doi pass", // HTML version of the message
        });

        console.log("Message sent:", info.messageId);
    },
    sendPasswordEmail: async function (to, username, password) {
        const info = await transporter.sendMail({
            from: '"Hệ thống NNPTUD-C5" <no-reply@nnptud-c5.com>',
            to: to,
            subject: "Tài khoản của bạn đã được tạo thành công",
            text: `Chào ${username},\n\nTài khoản của bạn đã được tạo. Mật khẩu mặc định của bạn là: ${password}\n\nVui lòng đăng nhập và đổi mật khẩu sớm nhất.`,
            html: `<h3>Chào <b>${username}</b>,</h3>
                   <p>Tài khoản của bạn trên hệ thống đã được tạo thành công từ file danh sách Excel.</p>
                   <p>Mật khẩu đăng nhập mặc định của bạn là: <b>${password}</b></p>
                   <br/>
                   <p>Vui lòng đăng nhập và tiến hành đổi mật khẩu sớm nhất để bảo mật tài khoản.</p>`,
        });

        console.log("Password email sent to:", to, "MessageID:", info.messageId);
    }
}
