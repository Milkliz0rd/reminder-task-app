import express from 'express'
import authRoute from './routes/auth';

const app = express();

// Middleware are settings here for test & server using
app.use(express.json());

// Use authentification routes
app.use("/auth", authRoute)

export default app;