import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductDialog } from './product-dialog';

describe('ProductDialog', () => {
  let component: ProductDialog;
  let fixture: ComponentFixture<ProductDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
