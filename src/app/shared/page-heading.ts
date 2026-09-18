import { afterNextRender, Directive, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[appPageHeading]',
  host: { tabindex: '-1' },
})
export class PageHeading {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    afterNextRender(() => this.element.nativeElement.focus());
  }
}
