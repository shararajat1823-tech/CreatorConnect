import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MetaService } from '../../core/meta.service';
import { RESPONSE } from '../../core/tokens';
import { StateViewComponent } from '../../ui/state-view.component';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, StateViewComponent],
  template: `
    <div class="cc-container cc-section">
      <app-state-view icon="🧭" title="Page not found" message="We couldn't find the page you were looking for.">
        <a class="cc-btn cc-btn--primary" routerLink="/">Go home</a>
        <a class="cc-btn cc-btn--ghost" routerLink="/directory">Browse creators</a>
      </app-state-view>
    </div>
  `,
})
export class NotFoundComponent implements OnInit {
  private readonly meta = inject(MetaService);
  private readonly response = inject(RESPONSE, { optional: true });

  ngOnInit(): void {
    this.response?.status(404);
    this.meta.setPage({ title: 'Page not found', noindex: true });
  }
}
