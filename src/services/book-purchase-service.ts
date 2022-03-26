import Constants from './../constants';
import puppeteer, { Browser, Page, SerializableOrJSHandle } from 'puppeteer';
import { BookMetadata } from 'types/book.model';

const chromePaths = require('chrome-paths');

export default class BookPurchaseService {
    //
    //inits the process of automatic purchase
    public async startPurchaseProcess(genreUrl: string): Promise<void> {
        const browser: Browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(genreUrl, { waitUntil: Constants.PUPPETEER_OPTION_WAIT_DOM_LOAD });
        const randomBookUrl = await this.getRandomBookUrlFromSelectedGenre(page);
        await Promise.all([page.goto(randomBookUrl, { waitUntil: Constants.PUPPETEER_OPTION_WAIT_DOM_LOAD }), page.waitForNavigation()]);
        const bookMetadata = await this.getBookMetadata(page);
        await browser.close();
        await this.buyBookFromAmazon(bookMetadata);
    }

    private async getRandomBookUrlFromSelectedGenre(page: Page): Promise<string> {
        return await page.$$eval('a.pollAnswer__bookLink', (bookLinks: Element[]) => {
            const randomBookUrl = (bookLinks[Math.floor(Math.random() * bookLinks.length)] as HTMLAnchorElement).href;
            return randomBookUrl;
        });
    }

    private async getBookMetadata(page: Page): Promise<BookMetadata> {
        return await page.$eval('#metacol.last.col', (metadataSection: Element) => {
            const bookInfoMetadataSection = metadataSection as HTMLElement;
            const bookTitle: string = (bookInfoMetadataSection.querySelector('h1#bookTitle') as HTMLElement).innerText;
            const authors: string[] = Array.from(bookInfoMetadataSection.querySelectorAll('.authorName__container .authorName > span')).map(
                (author: Element) => {
                    return (author as HTMLElement).innerText;
                }
            );
            if (!bookTitle || authors.length === 0) {
                throw new Error('An error occurred while fetching book metadata');
            } else {
                return { title: bookTitle, authors: authors };
            }
        });
    }

    private async buyBookFromAmazon(bookMetadata: BookMetadata): Promise<void> {
        let browser: Browser;
        try {
            browser = await puppeteer.launch({ headless: false, executablePath: chromePaths, defaultViewport: null });
        } catch {
            browser = await puppeteer.launch({ headless: false, defaultViewport: null });
        }
        const page = await browser.newPage();
        await page.goto(Constants.AMAZON_URL, { waitUntil: Constants.PUPPETEER_OPTION_WAIT_DOM_LOAD });
        await this.setSearchFieldValue(page, bookMetadata);
        await Promise.all([this.submitSearch(page), page.waitForNavigation()]);
        const productLink = await this.getBookLink(page);
        await page.goto(productLink, { waitUntil: Constants.PUPPETEER_OPTION_WAIT_DOM_LOAD });
        const addToCartButtonExists = !!(await page.$('#add-to-cart-button'));

        /* checks if add to cart button is already visible on page 
        (it means that paperback or hardcover are already selected)
        if not clicks on the paperback/hardcover type button */
        if (!addToCartButtonExists) {
            await Promise.all([
                this.clickPaperbookSwatchElement(page),
                page.waitForNavigation({ waitUntil: Constants.PUPPETEER_OPTION_WAIT_DOM_LOAD }),
            ]);
        }
        await Promise.all([this.addElementToCart(page), page.waitForNavigation({ waitUntil: Constants.PUPPETEER_OPTION_WAIT_DOM_LOAD })]);
        await Promise.all([this.goToCheckout(page), page.waitForNavigation()]);
        //await browser.close();
    }

    private async setSearchFieldValue(page: Page, bookMetadata: SerializableOrJSHandle | BookMetadata): Promise<string> {
        return await page.$eval(
            '#twotabsearchtextbox',
            (searchField: Element, _bookMetadata: unknown) => {
                const castedMetadata = _bookMetadata as BookMetadata;
                return ((searchField as HTMLInputElement).value = `${castedMetadata.title} - ${castedMetadata.authors.join(',')}`);
            },
            bookMetadata as SerializableOrJSHandle
        );
    }

    private async submitSearch(page: Page): Promise<void> {
        return await page.$eval('#nav-search-submit-button', (submitButton: Element) => {
            return (submitButton as HTMLElement).click();
        });
    }

    private async getBookLink(page: Page): Promise<string> {
        return await page.$eval(
            '.s-main-slot.s-result-list .sg-col-inner .sg-row .a-link-normal.s-underline-text.s-underline-link-text.s-link-style.a-text-normal',
            (bookPurchaseLink: Element) => {
                return (bookPurchaseLink as HTMLAnchorElement).href;
            }
        );
    }

    private async clickPaperbookSwatchElement(page: Page): Promise<void> {
        return await page.$$eval('#tmmSwatches .swatchElement .a-button-text > span', (bookPurchaseLinks: Element[]) => {
            const filteredPurchaseAnchors = bookPurchaseLinks.filter((bookPurchaseLink: Element) => {
                return (
                    (bookPurchaseLink as HTMLAnchorElement).innerText === 'Hardcover' ||
                    (bookPurchaseLink as HTMLAnchorElement).innerText === 'Paperback'
                );
            });
            if (filteredPurchaseAnchors.length === 0) {
                throw new Error('No Paperback or Hardcover found');
            } else {
                return (filteredPurchaseAnchors[0] as HTMLAnchorElement).click();
            }
        });
    }

    private async addElementToCart(page: Page): Promise<void> {
        return await page.$eval('#add-to-cart-button', (addToCartButton: Element) => {
            return (addToCartButton as HTMLElement).click();
        });
    }

    private async goToCheckout(page: Page): Promise<void> {
        return await page.$eval('input[name="proceedToRetailCheckout"]', (goToCheckoutButton: Element) => {
            return (goToCheckoutButton as HTMLElement).click();
        });
    }
}
