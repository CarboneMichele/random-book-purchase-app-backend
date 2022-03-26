import Constants from '../constants';
import puppeteer, { Browser, Page } from 'puppeteer';
import { Genre } from 'types/book.model';

export default class GenresService {
    public async getGenresData(): Promise<Genre[]> {
        const url = Constants.GOOD_READS_URL;
        const browser: Browser = await puppeteer.launch({ headless: true });
        const page: Page = await browser.newPage();
        await page.goto(url, { waitUntil: Constants.PUPPETEER_OPTION_WAIT_DOM_LOAD });
        const genresData: Genre[] = await this.getGenresList(page);
        await browser.close();
        return genresData;
    }

    public async getGenresList(page: Page): Promise<Genre[]> {
        return await page.evaluate(() => {
            const bookCategories = Array.from(document.querySelectorAll('div.categoryContainer .category')) as HTMLElement[];
            const genresData = bookCategories.map((categoryHTMLElement: HTMLElement) => {
                const link: string = categoryHTMLElement?.querySelector('a')?.href || '';
                const descriptionElement: HTMLElement | null = categoryHTMLElement?.querySelector('.category__copy');
                const description: string = descriptionElement?.innerText || '';
                return { label: description || '', value: link || '' };
            });
            if (genresData.length === 0) {
                throw new Error('No genre found');
            }
            return genresData;
        });
    }
}
