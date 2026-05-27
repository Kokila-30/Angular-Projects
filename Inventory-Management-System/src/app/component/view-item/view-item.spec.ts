import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewItem } from './view-item';

describe('ViewItem', () => {
  let component: ViewItem;
  let fixture: ComponentFixture<ViewItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewItem],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewItem);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
