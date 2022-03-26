import Constants from '../../constants';
import GenresService from '../../services/genres-service';
import { Router, Request, Response } from 'express';
import { Genre } from 'types/book.model';

const genresService = new GenresService();

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const genresData: Genre[] = await genresService.getGenresData();
        res.json(genresData).status(200);
    } catch (e) {
        const ex = e as Error;
        res.status(500).json({
            message: ex.message,
        });
        console.log(ex.stack);
    }
});

export const genreRouter = router;
