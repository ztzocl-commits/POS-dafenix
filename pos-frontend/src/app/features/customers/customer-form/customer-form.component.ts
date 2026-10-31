import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomerService } from '../../../core/services/customer.service';

// 0XXXXXXXXX (10 digits) | XXXXXXXXX (9 digits, no leading 0)
const PHONE_REGEX = /^(0\d{9}|[1-9]\d{8})$/;

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>{{ data.customer ? 'Editar cliente' : 'Agregar cliente' }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Nombre *</mat-label>
        <input matInput [(ngModel)]="name" />
      </mat-form-field>
      @if (submitted && !name.trim()) {
        <div class="field-error">Ingresa un nombre</div>
      }

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Teléfono móvil *</mat-label>
        <input matInput [(ngModel)]="phone" type="tel" placeholder="0771234567" />
      </mat-form-field>
      @if (submitted && !phone.trim()) {
        <div class="field-error">Ingresa un número de teléfono móvil</div>
      } @else if (submitted && phone.trim() && !phoneValid) {
        <div class="field-error">Formato: 0771234567 (10 dígitos) o 771234567 (9 dígitos)</div>
      }

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Correo electrónico</mat-label>
        <input matInput [(ngModel)]="email" type="email" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Dirección *</mat-label>
        <input matInput [(ngModel)]="address" />
      </mat-form-field>
      @if (submitted && !address.trim()) {
        <div class="field-error">Ingresa una dirección</div>
      }

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Notas</mat-label>
        <textarea matInput [(ngModel)]="notes" rows="2"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">CANCELAR</button>
      <button mat-flat-button class="save-btn" (click)="save()" [disabled]="loading">
        @if (loading) { <mat-spinner diameter="18" /> } @else { GUARDAR }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { padding: 16px 24px 0; color: #1b3050; font-weight: 700; }
    mat-dialog-content { padding: 8px 24px; min-width: 360px; }
    .full-width { width: 100%; }
    .save-btn { background: #1b3050 !important; color: #fff !important; }
    .field-error {
      color: #c62828;
      font-size: 12px;
      margin-top: -14px;
      margin-bottom: 10px;
      padding-left: 14px;
    }
  `]
})
export class CustomerFormComponent {
  dialogRef = inject(MatDialogRef<CustomerFormComponent>);
  data: any = inject(MAT_DIALOG_DATA);
  private customerService = inject(CustomerService);

  name    = this.data.customer?.name    || '';
  phone   = this.data.customer?.phone   || '';
  email   = this.data.customer?.email   || '';
  address = this.data.customer?.address || '';
  notes   = this.data.customer?.notes   || '';
  loading = false;
  submitted = false;

  get phoneValid(): boolean {
    return PHONE_REGEX.test(this.phone.trim().replace(/\s/g, ''));
  }

  save() {
    this.submitted = true;
    if (!this.name.trim() || !this.phone.trim() || !this.phoneValid || !this.address.trim()) return;
    this.loading = true;
    const payload = {
      name: this.name.trim(), phone: this.phone.trim(),
      email: this.email || undefined, address: this.address.trim(),
      notes: this.notes || undefined
    };
    const obs = this.data.customer
      ? this.customerService.update(this.data.customer.id, payload)
      : this.customerService.create(payload);
    obs.subscribe({
      next: () => this.dialogRef.close(true),
      error: () => { this.loading = false; }
    });
  }
}
