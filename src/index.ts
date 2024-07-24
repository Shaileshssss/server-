// import express, { RequestHandler } from 'express'

// const app = express()

// // const bodyParser : RequestHandler=(req, res, next) => {
// //     req.on('data',(chunk) => {
// //         req.body = JSON.parse(chunk);
// //         next()
// //         // res.json({message: "this is message from Request Handler"})
// //     })
// // }

// // app.use(bodyParser);
// app.use(express.json())
// // app.use(express.urlencoded({extended:false}));

// app.get('/', (req,res) => {
//     // res.send("<h1>Hello From Server</h1>");
//     // this will give the error
//     // res.status(401).send("<h1>Hello From Server</h1>");
//     res.json({message: "This is a message is coming from server"})
// });

// app.post("/",(req,res) => {
//             res.json({message: "This message is coming from post request"})

// })

// app.listen(8000, () => {
//     console.log('The app is running on http://localhost:8000');

// })

// ****************************************************
import "dotenv/config"
import "express-async-errors"
import 'src/db'
import express from 'express'
import authRouter from './routes/auth';
import formidable from "formidable";
import path from 'path'
import http from 'http'
import productRouter from "./routes/product";
import { sendErrRes } from "./utils/helper";
import { Server } from "socket.io";
import { TokenExpiredError, verify } from "jsonwebtoken";
import morgan from "morgan";
import conversationRouter from "./routes/conversation";
import ConversationModel from "./models/conversation";
import { updateSeenStatus } from "./controllers/conversation";


const app = express();
const server = http.createServer(app)
const io = new Server(server, {
    path: '/socket-message'
})

app.use(morgan('dev'))
app.use(express.static("src/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Api routes
app.use("/auth", authRouter);
app.use("/product", productRouter);
app.use("/conversation", conversationRouter)
console.log(path.join(__dirname, "public"));

// SOCKET IO
io.use((socket, next) => {
    const socketReq = socket.handshake.auth as { token: string } | undefined
    if (!socketReq?.token) {
        return next(new Error("Authentication error"));
    }

    try {

        socket.data.jwtDecode = verify(socketReq.token, process.env.JWT_SECRET!)
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            return next(new Error('jwt expired'))
        }
        return next(new Error("Invalid token!"))
    }
    next();
});

type MessageProfile = {
    id: string;
    name: string;
    avatar?: string;
}

type IncomingMessage = {
    message: {
        id: string;
        time: string;
        text: string;
        user: MessageProfile;
    },
    to: string,
    conversationId: string
};

type OutgoingMessageResponse = {
    message: {
        id: string;
        time: string;
        text: string;
        user: MessageProfile;
        viewed: boolean;
    },
    from: MessageProfile,
    conversationId: string
};

type SeenData ={
    messageId: string;
    peerId: string;
    conversationId: string;
}


io.on("connection", (socket) => {
   const socketData = socket.data as {jwtDecode: {id: string}}
   const userId = socketData.jwtDecode.id
   socket.join(userId)
    // console.log("New client connected");
    socket.on('chat:new', async (data: IncomingMessage) => {
        const {conversationId, to, message} = data;
      await  ConversationModel.findByIdAndUpdate(conversationId, {
            $push: {
                chats: {
                    sentBy: message.user.id,
                    content: message.text,
                    timestamp: message.time
                }
            }
        })

        const messageResponse: OutgoingMessageResponse = {
            from: message.user,
            conversationId,
            message: {...message, viewed: false},
        }
        // console.log(data);
        socket.to(to).emit("chat: message", messageResponse)
    })
    socket.on('chat:seen', async({conversationId, messageId, peerId}: SeenData) => {
        await updateSeenStatus(peerId, conversationId)
        socket.to(peerId).emit("chat:seen", {conversationId, messageId});
    })
})

// this is how where we can upload a file
app.post("/upload-file", async (req, res) => {
    const form = formidable({
        uploadDir: path.join(__dirname, 'public'),
        filename(name, ext, part, form) {
            return Date.now() + "_" + part.originalFilename;
        }
    });
    await form.parse(req)
    res.send("ok")
})

app.use(function (err, req, res, next) {
    res.status(500).json({ message: err.message })
} as express.ErrorRequestHandler)

app.use('*', (req, res) => {
    sendErrRes(res, "Not Found!", 404)
})

server.listen(8000, () => {
    console.log("The app is running on http://localhost:8000");
});