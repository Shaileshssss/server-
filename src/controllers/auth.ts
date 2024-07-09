import { RequestHandler } from "express";
import UserModel from "src/models/user";
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import AuthVerificationTokenModel from "src/models/authVerificationToken";
import { sendErrRes } from "src/utils/helper";
import jwt from 'jsonwebtoken'
// import { profile } from "console";


export const createNewUser: RequestHandler = async (req, res) => {

        // Read incoming data like: name, email, password
        const { email, name, password } = req.body;

        // Validate if the data is ok or not 
        if (!name) return sendErrRes(res, "Name is missing",422)
        if (!email) return sendErrRes(res, "Email is missing", 422)
        if (!password) return sendErrRes(res, "Password is missing", 422)
    
        // Check if we already have an account with same user
        const existingUser = await UserModel.findOne({ email })
        // send error if yes otherwise create new account and save user inside db
        if (existingUser) {
            return sendErrRes(res, "Unauthorized request, email is already in use", 401)
        }
      const user = await UserModel.create({ name, email, password });
    //   user.comparePassword
    
    // Generate and store verification token
    const token = crypto.randomBytes(36).toString('hex')
    await AuthVerificationTokenModel.create({owner: user._id, token})
    
    // send verification link with token to register email
    const link = `http://localhost:8000/verify?id=${user._id}&token=${token}`;
    
    const transport = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: "8b2171b14c3d86",
          pass: "53205ce555db9f"
        }
      });
    
      await transport.sendMail({
        from: "no-reply@localhost.com",
        to: user.email,
        html: `<h1>Please click on <a href="${link}"> this link</a> to verify your account.</h1>`
      });
    
      res.json({message: "Please check your inbox."})
    
        res.send(link);

};

export const verifyEmail : RequestHandler = async (req,res) => {
  const {id, token} = req.body

 const authToken = await AuthVerificationTokenModel.findOne({owner:id})
 if(!authToken) return sendErrRes(res, "Unauthorized request!", 403)

  const isMatched = await authToken.compareToken(token);
  if(!isMatched) return sendErrRes(res, "Unauthorized request!, invalid token", 403)

  await UserModel.findByIdAndUpdate(id, {verified:true})

  await AuthVerificationTokenModel.findByIdAndDelete(authToken._id);

  res.json({message: "Thanks for joining us, your email is verified."});
}

export const signIn: RequestHandler = async (req, res) => {

  const {email, password} = req.body;

  const user = await UserModel.findOne({email})
  if(!user) return sendErrRes(res, "Email/Password mismatch", 403)

    const isMatched = await user.comparePassword(password)
    if(!isMatched) return sendErrRes(res, "Email/Password mismatch", 403)


      const payload = {id: user._id}

      const accessToken = jwt.sign(payload, "secret",{
        expiresIn: "15m"
      })
      const refreshToken = jwt.sign(payload,"secret")

      if(!user.tokens) user.tokens = [refreshToken]
      else user.tokens.push(refreshToken)

      await user.save();

      res.json({
        profile: {
          id: user._id,
          email: user.email,
          name: user.name,
          verified: user.verified,
        },
        tokens: {refresh: refreshToken, access: accessToken}
      })
    };
