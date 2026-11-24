import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MetaService } from '../../core/meta.service';
import { STATIC_PAGES, type StaticPage } from './content';

@Component({
  selector: 'app-static-page',
  template: `
    @if (page) {
      <div class="cc-container cc-section cc-prose">
        <h1>{{ page.title }}</h1>
        <p class="cc-muted lead">{{ page.intro }}</p>
        @for (s of page.sections; track s.heading) {
          <section>
            @if (s.heading) { <h2>{{ s.heading }}</h2> }
            @for (p of s.body; track p) { <p>{{ p }}</p> }
          </section>
        }
      </div>
    }
  `,
  styles: [`.lead { font-size: var(--cc-text-lg); } section { margin-top: var(--cc-space-5); }`],
})
export class StaticPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly meta = inject(MetaService);
  page: StaticPage | null = null;

  ngOnInit(): void {
    const key = this.route.snapshot.data['page'] as string;
    this.page = STATIC_PAGES[key] ?? null;
    if (this.page) {
      this.meta.setPage({
        title: this.page.title,
        description: this.page.intro,
        path: `/${this.page.key}`,
      });
    }
  }
}
