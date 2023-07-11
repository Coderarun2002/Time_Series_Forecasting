import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileinComponent } from './filein.component';

describe('FileinComponent', () => {
  let component: FileinComponent;
  let fixture: ComponentFixture<FileinComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FileinComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
