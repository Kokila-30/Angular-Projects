import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceDialog } from './invoice-dialog';

describe('InvoiceDialog', () => {
  let component: InvoiceDialog;
  let fixture: ComponentFixture<InvoiceDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
