declare module 'page-flip/dist/js/page-flip.module.js' {
  export interface FlipEvent<T = unknown> {
    data: T
    object: PageFlip
  }
  export class PageFlip {
    constructor(el: HTMLElement, settings: Record<string, unknown>)
    loadFromHTML(items: HTMLElement[] | NodeListOf<HTMLElement>): void
    loadFromImages(urls: string[]): void
    flipNext(corner?: 'top' | 'bottom'): void
    flipPrev(corner?: 'top' | 'bottom'): void
    flip(page: number, corner?: 'top' | 'bottom'): void
    turnToPage(page: number): void
    getCurrentPageIndex(): number
    getPageCount(): number
    getOrientation(): 'portrait' | 'landscape'
    on(event: 'flip' | 'init' | 'changeOrientation' | 'changeState' | 'update', cb: (e: FlipEvent) => void): PageFlip
    update(): void
    destroy(): void
  }
}
