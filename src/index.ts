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
import "express-async-errors"
import 'src/db'
import express from 'express'
import authRouter from './routes/auth';

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:false}));

// Api routes
app.use("/auth",authRouter);

app.use(function (err,req,res,next) {
    res.status(500).json({message: err.message})
} as express.ErrorRequestHandler)

app.listen(8000, () => {
    console.log("The app is running on http://localhost:8000");
});