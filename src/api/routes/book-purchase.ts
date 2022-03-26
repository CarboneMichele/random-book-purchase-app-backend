import BookPurchaseService from '../../services/book-purchase-service';
import { Router, Request, Response } from 'express';

const router = Router();

const bookPurchaseService = new BookPurchaseService();

router.post('/', async (req: Request, res: Response) => {
    try {
        await bookPurchaseService.startPurchaseProcess(req.body.bookUrl);
        res.json().status(200);
    } catch (e) {
        const ex = e as Error;
        res.status(500).json({
            message: ex.message,
        });
        console.log(ex.stack);
    }
});

export const purchaseRouter = router;
