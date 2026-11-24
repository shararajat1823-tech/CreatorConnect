import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { brand } from '@creatorconnect/shared';
import { env } from './env';

export interface PageMeta {
  title: string;
  description?: string;
  /** Path beginning with '/'. Used for canonical + og:url. */
  path?: string;
  image?: string | null;
  type?: 'website' | 'profile' | 'article';
  noindex?: boolean;
}

@Injectable({ providedIn: 'root' })
export class MetaService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  setPage(page: PageMeta): void {
    const fullTitle = page.title.includes(brand.name)
      ? page.title
      : `${page.title} · ${brand.name}`;
    const description = page.description ?? brand.intro;
    const url = page.path ? `${env.siteUrl}${page.path}` : env.siteUrl;

    this.title.setTitle(fullTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({
      name: 'robots',
      content: page.noindex ? 'noindex, nofollow' : 'index, follow',
    });

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: page.type ?? 'website' });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:site_name', content: brand.name });
    if (page.image) this.meta.updateTag({ property: 'og:image', content: page.image });

    // Twitter
    this.meta.updateTag({ name: 'twitter:card', content: page.image ? 'summary_large_image' : 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    if (page.image) this.meta.updateTag({ name: 'twitter:image', content: page.image });

    this.setCanonical(url);
  }

  private setCanonical(url: string): void {
    let link = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
