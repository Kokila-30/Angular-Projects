import { Component, ElementRef, AfterViewInit, forwardRef, Input, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rich-editor-container">
      <div *ngIf="!isBrowser" class="border border-gray-300 rounded-lg p-3 bg-gray-50">
        Loading editor...
      </div>
      <div *ngIf="isBrowser" id="editor-{{editorId}}"></div>
    </div>
  `,
  styles: [`
    .rich-editor-container {
      min-height: 200px;
    }
    :host ::ng-deep .ql-container {
      min-height: 150px;
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true
    }
  ]
})
export class RichTextEditorComponent implements AfterViewInit, ControlValueAccessor {
  @Input() placeholder: string = 'Enter description...';
  editorId = Math.random().toString(36).substring(2, 8);
  isBrowser: boolean;
  private quill: any;
  private value: string = '';
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.initQuill();
    }
  }

  private async initQuill(): Promise<void> {
    const Quill = (await import('quill')).default;
    const container = document.getElementById(`editor-${this.editorId}`);
    
    if (container) {
      this.quill = new Quill(container, {
        theme: 'snow',
        placeholder: this.placeholder,
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ script: 'sub' }, { script: 'super' }],
            [{ indent: '-1' }, { indent: '+1' }],
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            [{ color: [] }, { background: [] }],
            [{ font: [] }],
            [{ align: [] }],
            ['clean']
          ]
        }
      });

      if (this.value) {
        this.quill.root.innerHTML = this.value;
      }

      this.quill.on('text-change', () => {
        const html = this.quill.root.innerHTML;
        this.value = html;
        this.onChange(html);
        this.onTouched();
      });
    }
  }

  writeValue(value: string): void {
    this.value = value || '';
    if (this.quill && this.isBrowser) {
      this.quill.root.innerHTML = this.value;
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (this.quill && this.isBrowser) {
      this.quill.enable(!isDisabled);
    }
  }
}