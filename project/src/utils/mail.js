import Mailgen from 'mailgen';
import nodemailer from 'nodemailer';


const sendMail=async(options)=>{

    const mailGenerator=new Mailgen
    (
        {
        theme:'default',
        product:{
            name:'userprod',
            link:'https://userprod.in'
        }
        }
    );
    const emailBody=mailGenerator.generate(options.mailgenContent);
    const emailtext=mailGenerator.generatePlaintext(options.mailgenContent);


        var transport = nodemailer.createTransport({
        host: process.env.MAILTRAP_HOST,
        port: process.env.MAILTRAP_PORT,
        auth: {
            user: process.env.MAILTRAP_USER,
            pass: process.env.MAILTRAP_PASSWORD,
        }
        });
    
    const message={
        from:'management@userprod.in',
        to:options.email,
        subject:options.subject,
        text:emailtext,
        html:emailBody,
    }

    try {
        await transport.sendMail(message);
    } catch (error) {
        console.error("Email service failed ",error);
    }
};


const forgotpassowrdMailgenContent=(username,passwordResetUrl)=>{
    return {
        body:{
            name:username,
            intro:"We have received request to reset your password",
            action:{
                instructions:"To reset your password click on the following button",
                button:{
                    color:"#DC17CB",
                    text:"Reset Password",
                    link:passwordResetUrl,
                },
            },
            outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
        },
    };
};

export {sendMail,forgotpassowrdMailgenContent}