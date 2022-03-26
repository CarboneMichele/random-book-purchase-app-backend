import { genreRouter } from './api/routes/book-genres';
import { purchaseRouter } from './api/routes/book-purchase';
import { environment } from './environment';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

app.use('/genres', genreRouter);
app.use('/purchase', purchaseRouter);

app.listen(environment.defaultPort, () => {
    console.log(`listening on port ${environment.defaultPort}`);
});
