import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Planner } from './planner';

const dependencies = vi.hoisted(() => ({ capture: vi.fn(), create: vi.fn() }));
vi.mock('html2canvas-pro', () => ({ default: dependencies.capture }));
vi.mock('pdf-lib', () => ({ PDFDocument: { create: dependencies.create } }));
registerLocaleData(localePt);

const message = 'Could not export your PDF. Please try again.';

describe('Planner PDF export', () => {
  let fixture: ComponentFixture<Planner>;
  let component: Planner;
  let toDataURL: ReturnType<typeof vi.fn>;
  let embedPng: ReturnType<typeof vi.fn>;
  let save: ReturnType<typeof vi.fn>;
  let click: ReturnType<typeof vi.spyOn>;
  let download: { filename: string; href: string } | undefined;
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    localStorage.clear();
    dependencies.capture.mockReset();
    dependencies.create.mockReset();
    toDataURL = vi.fn().mockReturnValue('data:image/png;base64,cG5n');
    dependencies.capture.mockResolvedValue({ toDataURL });
    embedPng = vi.fn().mockResolvedValue({ width: 1000, height: 1200 });
    save = vi.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70]));
    dependencies.create.mockResolvedValue({
      embedPng,
      addPage: vi.fn().mockReturnValue({ drawImage: vi.fn() }),
      save,
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ arrayBuffer: async () => new ArrayBuffer(3) }),
    );
    createObjectURL = vi.fn().mockReturnValue('blob:money-plan-test');
    revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL, revokeObjectURL }));
    download = undefined;
    click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      download = { filename: this.download, href: this.href };
    });
    await TestBed.configureTestingModule({ imports: [Planner] }).compileComponents();
    fixture = TestBed.createComponent(Planner);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it.each(['capture', 'image', 'create', 'embed', 'save', 'download'])(
    'reports %s failure and releases loading',
    async (stage) => {
      const error = new Error('export failed');
      if (stage === 'capture') dependencies.capture.mockRejectedValueOnce(error);
      if (stage === 'image')
        toDataURL.mockImplementationOnce(() => {
          throw error;
        });
      if (stage === 'create') dependencies.create.mockRejectedValueOnce(error);
      if (stage === 'embed') embedPng.mockRejectedValueOnce(error);
      if (stage === 'save') save.mockRejectedValueOnce(error);
      if (stage === 'download')
        click.mockImplementationOnce(() => {
          throw error;
        });
      await component.exportPdf();
      await fixture.whenStable();
      expect(component.isExportingPdf()).toBe(false);
      expect(component.exportError()).toBe(true);
      expect(
        (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent?.trim(),
      ).toBe(message);
      expect(document.querySelector('a[download="money-plan.pdf"]')).toBeNull();
      if (stage === 'download')
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:money-plan-test');
    },
  );

  it('clears the error on retry and downloads successfully with the same button', async () => {
    dependencies.capture.mockRejectedValueOnce(new Error('capture'));
    await component.exportPdf();
    await fixture.whenStable();
    expect(component.exportError()).toBe(true);
    let resolveCapture!: (canvas: { toDataURL: typeof toDataURL }) => void;
    dependencies.capture.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveCapture = resolve;
      }),
    );
    const button = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find(
      (element) => element.textContent?.trim() === 'Export PDF',
    )!;
    expect(button.disabled).toBe(false);
    button.click();
    await vi.waitFor(() => expect(dependencies.capture).toHaveBeenCalledTimes(2));
    expect(component.exportError()).toBe(false);
    expect(component.isExportingPdf()).toBe(true);
    resolveCapture({ toDataURL });
    await vi.waitFor(() => expect(component.isExportingPdf()).toBe(false));
    await fixture.whenStable();
    expect(download).toEqual({ filename: 'money-plan.pdf', href: 'blob:money-plan-test' });
    expect(createObjectURL.mock.calls[0][0].type).toBe('application/pdf');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:money-plan-test');
    expect(document.querySelector('a[download="money-plan.pdf"]')).toBeNull();
    expect(component.exportError()).toBe(false);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent?.trim() ??
        '',
    ).toBe('');
  });

  it('prevents concurrent exports inside the handler', async () => {
    let resolveCapture!: (canvas: { toDataURL: typeof toDataURL }) => void;
    dependencies.capture.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveCapture = resolve;
      }),
    );
    const first = component.exportPdf();
    const duplicate = component.exportPdf();
    await vi.waitFor(() => expect(dependencies.capture).toHaveBeenCalledTimes(1));
    expect(component.isExportingPdf()).toBe(true);
    resolveCapture({ toDataURL });
    await Promise.all([first, duplicate]);
    expect(click).toHaveBeenCalledTimes(1);
    expect(download?.filename).toBe('money-plan.pdf');
    expect(component.isExportingPdf()).toBe(false);
  });

  it('prevents invalid exports even when called directly', async () => {
    component.model.update((inputs) => ({ ...inputs, years: 0 }));
    await component.exportPdf();
    expect(dependencies.capture).not.toHaveBeenCalled();
    expect(download).toBeUndefined();
    expect(component.isExportingPdf()).toBe(false);
    expect(component.exportError()).toBe(false);
  });

  it('releases loading and reports cleanup failure', async () => {
    revokeObjectURL.mockImplementationOnce(() => {
      throw new Error('cleanup');
    });
    await component.exportPdf();
    expect(component.isExportingPdf()).toBe(false);
    expect(component.exportError()).toBe(true);
    expect(document.querySelector('a[download="money-plan.pdf"]')).toBeNull();
  });
});
