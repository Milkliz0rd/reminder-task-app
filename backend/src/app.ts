import express from 'express'
const app = express();

// Middleware are settings here for test & server using
app.use(express.json());

export default app;