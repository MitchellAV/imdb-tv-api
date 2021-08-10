require("dotenv").config();
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { ErrorType } from "./util/types";

import apiRouter from "./routes/api";
const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Routes
app.use("/api", apiRouter);

app.use((err: ErrorType, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(err.status).json(err);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on Port: ${PORT}`));
