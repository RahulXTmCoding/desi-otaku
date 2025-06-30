import express from 'express';

const app = express();
const port = process.env.PORT || 5000;

import userRoutes from './routes/userRoutes';
import productRoutes from './routes/productRoutes';

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

app.listen(port, () => console.log(`Listening on port ${port}`));
