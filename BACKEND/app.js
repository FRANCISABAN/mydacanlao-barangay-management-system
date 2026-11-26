import express from 'express';
import cors from 'cors';
import studentRoutes from './routes/studentRoutes.js';
import skRoutes from './routes/skRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';

// Basahin palagi ang .env na nasa BACKEND folder.
config({ path: fileURLToPath(new URL('./.env', import.meta.url)) });


let corsOptions = {
    origin: 'http://localhost:5173',
}

const app = express();

// uploaded files arrive as text, so the limit is bigger than the default
app.use(express.json({ limit: '6mb' }));
app.use(cors(corsOptions));

app.use('/student', studentRoutes);
app.use('/sk', skRoutes);
app.use('/notifications', emailRoutes);

try{
    const port = 3000;
    app.listen(port, () => {
        console.log(`listening to port ${port}`);
    });

} catch (e) {
    console.log(e);
}