import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./docs/swagger.js";


const app=express();


app.use("/uploads", express.static("uploads"));
//config
app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended:true,limit:"16kb"}));
app.use(express.static("public"));
app.use(cookieParser());

//cors config
app.use(cors({
    origin:process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",credentials:true,
    methods:["GET","POST","PUT","DELETE","PATCH","OPTIONS"],
    allowedHeaders:["Content-Type","Authorization"],
}),
 );

// import routes

import authRouter from './routes/auth.route.js'
import imgRouter from './routes/image.route.js'
import expinpcsvRouter from './routes/expinpcsv.route.js'
import { errorHandler } from "./middlewares/error.middleware.js";

app.use("/api/v1/auth",authRouter);
app.use("/api/v1/image",imgRouter);
app.use("/api/v1/export",expinpcsvRouter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use(errorHandler);
app.get('/', (req, res) => {
  res.send('Hello World!')
})

export default app; 
