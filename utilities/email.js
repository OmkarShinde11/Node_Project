const nodeEmailer=require('nodemailer');

// const sendEmail = async options=>{
//     console.log('options:::',   )
//     //create a transporter

//     const transport=nodeEmailer.createTransport({
//         host:process.env.HOST,
//         port:process.env.PORT,
//         auth:{
//             user:process.env.HOST_USERNAME,
//             pass:process.env.HOST_PASSWORD
//         }        
//     });

//     //create an options

//     const mailOptions={
//         from:'vaishu@gmail.com',
//         to:options.email,
//         subject:options.subject,
//         text:options.message
//     }

//     //send an mail
//     await transport.sendMail(mailOptions).then(res=>{}).catch(err=>{console.log(err)});
// }

class Email{
    constructor(user,url) {
        this.firstName=user.name.split(' ')[0],
        this.email=user.email,
        this.url=url
        this.from='vaishu@gmail.com'
    }

    createTransporter(){
        if(process.env.NODE_ENV==='production'){
            return 1
        }
        const transport=nodeEmailer.createTransport({
            host:process.env.HOST,
            port:process.env.PORT,
            auth:{
                user:process.env.HOST_USERNAME,
                pass:process.env.HOST_PASSWORD
            }        
        });
        return transport;
    }

    async send(subject,message){
        const mailOptions={
            from:this.from,
            to:this.email,
            subject:subject,
            text:message
        }

        await this.createTransporter().sendMail(mailOptions);
    }

    async sendPasswordResetTokenEmail(){
        const message=`To forgot a password click on below link\n ${this.url}\n if you didn't then ignore this mail`;
        const subject='Forgot Password (valid till 10 minutes)';
        await this.send(message,subject);
    }
}

// module.exports=sendEmail;
module.exports=Email;