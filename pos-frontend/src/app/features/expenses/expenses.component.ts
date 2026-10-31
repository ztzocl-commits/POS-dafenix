import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ExpenseService } from '../../core/services/expense.service';
import { SalespersonService, SupplierService, TempWorkerService } from '../../core/services/product.service';
import { Expense, ExpenseCategory, CATEGORY_LABELS, CATEGORY_ICONS } from '../../core/models/expense.model';
import { Supplier, Salesperson, type TempWorker } from '../../core/models/product.model';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSnackBarModule, MatTabsModule, MatTooltipModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Gastos</h1>
          <p class="page-sub">Registra los gastos diarios de la tienda</p>
        </div>
        <input type="date" class="date-picker" [(ngModel)]="selectedDate" (ngModelChange)="onDateChange()" />
      </div>

      <mat-tab-group class="tab-group" animationDuration="150ms">

        <!-- â”€â”€ RECORD EXPENSE â”€â”€ -->
        <mat-tab label="Registrar gasto">
          <div class="tab-content">

            <!-- Quick Buttons -->
            <mat-card class="section-card">
              <h3 class="section-title">Agregar rápidamente</h3>
              <div class="quick-grid">
                <button class="quick-btn tea" (click)="quickAdd('TEA', 150, 'Tea - Morning')">
                  <mat-icon>local_cafe</mat-icon>
                  <span>Té de la mañana</span>
                  <small>Rs 150</small>
                </button>
                <button class="quick-btn tea" (click)="quickAdd('TEA', 130, 'Tea - Evening')">
                  <mat-icon>local_cafe</mat-icon>
                  <span>Té de la tarde</span>
                  <small>Rs 130</small>
                </button>
              </div>
            </mat-card>

            <!-- Supplier Payment -->
            <mat-card class="section-card">
              <h3 class="section-title">
                <mat-icon>local_shipping</mat-icon> Pago a proveedor
              </h3>
              <div class="form-grid">
                <div class="field-wrap">
                  <label class="field-label">Proveedor</label>
                  <select class="styled-select" [(ngModel)]="sp.supplierId" (ngModelChange)="onSupplierSelect()">
                    <option [value]="undefined">Selecciona un proveedor...</option>
                    @for (s of suppliers; track s.id) {
                      <option [value]="s.id">{{ s.name }} {{ s.type === 'SHOP_NEED' ? '(Tienda)' : '' }}</option>
                    }
                  </select>
                </div>
                @if (selectedSupplier) {
                  <div class="balance-badge" [class.credit]="selectedSupplier.balance > 0" [class.clear]="selectedSupplier.balance <= 0">
                    <mat-icon>account_balance</mat-icon>
                    Saldo pendiente: Rs {{ selectedSupplier.balance | number:'1.0-0' }}
                    @if (selectedSupplier.type === 'SHOP_NEED' && auth.isOwner()) {
                      &nbsp;—&nbsp;
                      <a class="ledger-link" (click)="goToLedger(selectedSupplier)">Ver registro de entregas</a>
                    }
                  </div>
                }
                <div class="field-wrap">
                  <label class="field-label">Monto del pago (Rs)</label>
                  <input class="styled-input" type="number" [(ngModel)]="sp.amount" placeholder="0" min="0" />
                </div>
                <div class="field-wrap">
                  <label class="field-label">Nota (opcional)</label>
                  <input class="styled-input" [(ngModel)]="sp.note" placeholder="N.º de factura, artículos..." />
                </div>
              </div>
              <div class="card-actions">
                <button mat-flat-button class="submit-btn" (click)="addSupplierPayment()"
                  [disabled]="!sp.supplierId || !sp.amount || sp.amount <= 0">
                  <mat-icon>payments</mat-icon> Registrar pago
                </button>
              </div>
              @if (selectedSupplier?.type === 'SHOP_NEED' && auth.isOwner()) {
                <div class="delivery-hint">
                  <mat-icon>info</mat-icon>
                  Para agregar un saldo a este proveedor, registra una entrega en
                  <a class="ledger-link" (click)="goToDeliveries()">Suministros de tienda</a>
                  — las entregas se registran con artículo, cantidad y precio para que el propietario las verifique.
                </div>
              }
            </mat-card>

            <!-- Bus Fare -->
            <mat-card class="section-card">
              <h3 class="section-title">
                <mat-icon>directions_bus</mat-icon> Pasaje de autobús
              </h3>
              <div class="form-grid">
                <div class="field-wrap">
                  <label class="field-label">Empleado</label>
                  <select class="styled-select" [(ngModel)]="bf.salespersonId">
                    <option [value]="undefined">Selecciona un empleado...</option>
                    @for (s of salespersons; track s.id) {
                      <option [value]="s.id">{{ s.name }}</option>
                    }
                  </select>
                </div>
                <div class="field-wrap">
                  <label class="field-label">Monto (Rs)</label>
                  <input class="styled-input" type="number" [(ngModel)]="bf.amount" placeholder="300" />
                </div>
                <div class="field-wrap">
                  <label class="field-label">Nota</label>
                  <input class="styled-input" [(ngModel)]="bf.note" placeholder="Descontar del salario" />
                </div>
              </div>
              <div class="card-actions">
                <button mat-flat-button class="submit-btn" (click)="addBusFare()"
                  [disabled]="!bf.salespersonId || !bf.amount || bf.amount <= 0">
                  <mat-icon>add</mat-icon> Agregar pasaje
                </button>
              </div>
            </mat-card>


            <!-- Salary -->
            <mat-card class="section-card">
              <h3 class="section-title">
                <mat-icon>payments</mat-icon> Pago de salario
              </h3>
              <div class="form-grid">
                <div class="field-wrap">
                  <label class="field-label">Empleado</label>
                  <select class="styled-select" [(ngModel)]="sal.salespersonId">
                    <option [value]="undefined">Selecciona un empleado...</option>
                    @for (s of salespersons; track s.id) {
                      <option [value]="s.id">{{ s.name }}</option>
                    }
                  </select>
                </div>
                <div class="field-wrap">
                  <label class="field-label">Monto (Rs)</label>
                  <input class="styled-input" type="number" [(ngModel)]="sal.amount" placeholder="0" />
                </div>
                <div class="field-wrap">
                  <label class="field-label">Nota (opcional)</label>
                  <input class="styled-input" [(ngModel)]="sal.note" placeholder="Mes, deducciones..." />
                </div>
              </div>
              <div class="card-actions">
                <button mat-flat-button class="submit-btn" (click)="addSalary()"
                  [disabled]="!sal.salespersonId || !sal.amount || sal.amount <= 0">
                  <mat-icon>add</mat-icon> Pagar salario
                </button>
              </div>
            </mat-card>

            <!-- Other -->
            <mat-card class="section-card">
              <h3 class="section-title">
                <mat-icon>receipt</mat-icon> Otro gasto
              </h3>
              <div class="form-grid">
                <div class="field-wrap">
                  <label class="field-label">Descripción</label>
                  <input class="styled-input" [(ngModel)]="other.note" placeholder="Electricidad, alquiler, embalaje..." />
                </div>
                <div class="field-wrap">
                  <label class="field-label">Monto (Rs)</label>
                  <input class="styled-input" type="number" [(ngModel)]="other.amount" placeholder="0" />
                </div>
              </div>
              <div class="card-actions">
                <button mat-flat-button class="submit-btn" (click)="addOther()"
                  [disabled]="!other.note || !other.amount || other.amount <= 0">
                  <mat-icon>add</mat-icon> Agregar gasto
                </button>
              </div>
            </mat-card>

          </div>
        </mat-tab>

        <!-- â”€â”€ TODAY'S LIST â”€â”€ -->
        <mat-tab [label]="'Today (' + expenses.length + ')'">
          <div class="tab-content">
            <mat-card>
              @if (expenses.length === 0) {
                <div class="empty-state">
                  <mat-icon>receipt_long</mat-icon>
                  <p>No hay gastos para el {{ selectedDate | date:'dd/MM/yyyy' }}</p>
                </div>
              } @else {
                <div class="expense-total-bar">
                  Total: <strong>Rs {{ dayTotal | number:'1.0-0' }}</strong>
                </div>
                @for (e of expenses; track e.id) {
                  <div class="expense-row">
                    <div class="exp-icon" [class]="e.category.toLowerCase()">
                      <mat-icon>{{ getCatIcon(e.category) }}</mat-icon>
                    </div>
                    <div class="exp-info">
                      <div class="exp-cat">{{ getCatLabel(e.category) }}
                        @if (e.supplier) { <span class="exp-tag">{{ e.supplier.name }}</span> }
                        @if (e.salesperson) { <span class="exp-tag">{{ e.salesperson.name }}</span> }
                      </div>
                      @if (e.note) { <div class="exp-note">{{ e.note }}</div> }
                      <div class="exp-time">{{ e.createdAt | date:'HH:mm' }}</div>
                    </div>
                    <div class="exp-amount">Rs {{ e.amount | number:'1.0-0' }}</div>
                    <button class="del-btn" (click)="deleteExpense(e)" matTooltip="Eliminar">
                      <mat-icon>delete_outline</mat-icon>
                    </button>
                  </div>
                }
              }
            </mat-card>
          </div>
        </mat-tab>

        <!-- â”€â”€ REPORTS â”€â”€ -->
        <mat-tab label="Informes">
          <div class="tab-content">
            <mat-card class="section-card">
              <h3 class=”section-title”>Resumen diario - {{ selectedDate | date:'dd MMM yyyy' }}</h3>
              @if (dailySummary && objectKeys(dailySummary).length > 0) {
                <div class="summary-grid">
                  @for (key of objectKeys(dailySummary); track key) {
                    <div class="summary-row">
                      <div class="sum-icon" [class]="key.toLowerCase()">
                        <mat-icon>{{ getCatIcon(key) }}</mat-icon>
                      </div>
                      <span class="sum-label">{{ getCatLabel(key) }}</span>
                      <span class="sum-amount">Rs {{ dailySummary[key] | number:'1.0-0' }}</span>
                    </div>
                  }
                  <div class="summary-total">
                    <span>Total</span>
                    <span>Rs {{ dailyTotal | number:'1.0-0' }}</span>
                  </div>
                </div>
              } @else {
                <p class="no-data">No hay gastos en esta fecha.</p>
              }
            </mat-card>

            <mat-card class="section-card">
              <h3 class="section-title">Resumen mensual</h3>
              <div class="month-picker">
                <input type="month" class="date-picker" [(ngModel)]="selectedMonth" (ngModelChange)="loadMonthly()" />
              </div>
              @if (monthlySummary && objectKeys(monthlySummary).length > 0) {
                <div class="summary-grid">
                  @for (key of objectKeys(monthlySummary); track key) {
                    <div class="summary-row">
                      <div class="sum-icon" [class]="key.toLowerCase()">
                        <mat-icon>{{ getCatIcon(key) }}</mat-icon>
                      </div>
                      <span class="sum-label">{{ getCatLabel(key) }}</span>
                      <span class="sum-amount">Rs {{ monthlySummary[key] | number:'1.0-0' }}</span>
                    </div>
                  }
                  <div class="summary-total">
                    <span>Total</span>
                    <span>Rs {{ monthlyTotal | number:'1.0-0' }}</span>
                  </div>
                </div>
              } @else {
                <p class="no-data">No hay gastos este mes.</p>
              }
            </mat-card>

            <!-- Supplier Balances -->
            <mat-card class="section-card">
              <h3 class="section-title">Saldos de proveedores (montos adeudados)</h3>
              @if (suppliers.length === 0) {
                <p class="no-data">No hay proveedores.</p>
              } @else {
                @for (s of suppliersWithBalance; track s.id) {
                  <div class="supplier-balance-row">
                    <mat-icon>local_shipping</mat-icon>
                    <span class="sb-name">{{ s.name }}</span>
                    <span class="sb-amount" [class.owed]="s.balance > 0" [class.clear]="s.balance <= 0">
                      Rs {{ s.balance | number:'1.0-0' }}
                    </span>
                  </div>
                }
              }
            </mat-card>
          </div>
        </mat-tab>

      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 780px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .page-title { font-size: 22px; font-weight: 700; color: #1b3050; margin: 0; }
    .page-sub { color: #888; font-size: 13px; margin: 2px 0 0; }

    .date-picker {
      border: 1px solid #e2e6ec; border-radius: 6px; padding: 7px 10px;
      font-size: 13px; color: #1b3050; font-family: inherit; outline: none;
    }
    .date-picker:focus { border-color: #c9a84c; }

    .tab-group { margin-top: 4px; }
    .tab-content { padding: 16px 0; display: flex; flex-direction: column; gap: 14px; }

    .section-card { padding: 16px !important; }
    .section-title {
      font-size: 14px; font-weight: 700; color: #1b3050;
      margin: 0 0 12px; display: flex; align-items: center; gap: 6px;
    }
    .section-title mat-icon { font-size: 18px; width: 18px; height: 18px; color: #6b7280; }

    /* Quick buttons */
    .quick-grid { display: flex; gap: 10px; flex-wrap: wrap; }
    .quick-btn {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 12px 20px; border: 1px solid #e2e6ec; border-radius: 8px;
      background: #fff; cursor: pointer; transition: all 0.15s; min-width: 110px;
      font-family: inherit;
    }
    .quick-btn mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .quick-btn span { font-size: 13px; font-weight: 600; color: #1b3050; }
    .quick-btn small { font-size: 11px; color: #6b7280; }
    .quick-btn.tea mat-icon { color: #c9a84c; }
    .quick-btn:hover { border-color: #c9a84c; background: #fffbf0; }

    /* Form */
    .form-grid { display: flex; flex-direction: column; gap: 10px; }
    .field-wrap { display: flex; flex-direction: column; gap: 4px; }
    .field-wrap.inline { flex-direction: row; align-items: center; }
    .field-label { font-size: 12px; color: #6b7280; font-weight: 500; }
    .styled-input, .styled-select {
      border: 1px solid #e2e6ec; border-radius: 6px; padding: 8px 10px;
      font-size: 14px; color: #1b3050; font-family: inherit; outline: none;
      transition: border-color 0.15s; background: #fff; width: 100%; box-sizing: border-box;
    }
    .styled-input:focus, .styled-select:focus { border-color: #c9a84c; }
    .styled-input.small { width: 150px; }

    .card-actions { display: flex; gap: 10px; align-items: center; margin-top: 12px; flex-wrap: wrap; }
    .submit-btn { background: #1b3050 !important; color: #fff !important; font-size: 13px !important; }
    .add-balance-btn { font-size: 13px !important; }

    .balance-badge {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600;
    }
    .balance-badge mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .balance-badge.credit { background: #fdecea; color: #c62828; }
    .balance-badge.clear { background: #e8f5e9; color: #2e7d32; }

    /* Expense list */
    .expense-total-bar {
      padding: 10px 16px; background: #f8f9fc; border-bottom: 1px solid #eef0f4;
      font-size: 14px; color: #1b3050;
    }
    .expense-row {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 16px; border-bottom: 1px solid #eef0f4;
    }
    .expense-row:last-child { border-bottom: none; }
    .exp-icon {
      width: 34px; height: 34px; border-radius: 8px; display: flex;
      align-items: center; justify-content: center; flex-shrink: 0;
      background: #f4f6f9;
    }
    .exp-icon mat-icon { font-size: 18px; width: 18px; height: 18px; color: #6b7280; }
    .exp-icon.supplier_payment { background: #e3f2fd; } .exp-icon.supplier_payment mat-icon { color: #1565c0; }
    .exp-icon.tea { background: #fff8e1; } .exp-icon.tea mat-icon { color: #c9a84c; }
    .exp-icon.bus_fare { background: #e8f5e9; } .exp-icon.bus_fare mat-icon { color: #2e7d32; }
    .exp-icon.temp_worker { background: #fce4ec; } .exp-icon.temp_worker mat-icon { color: #c2185b; }
    .exp-icon.salary { background: #f3e5f5; } .exp-icon.salary mat-icon { color: #7b1fa2; }
    .exp-icon.other { background: #f4f6f9; } .exp-icon.other mat-icon { color: #6b7280; }

    .exp-info { flex: 1; min-width: 0; }
    .exp-cat { font-size: 13px; font-weight: 600; color: #1b3050; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .exp-tag { font-size: 11px; background: #eef0f4; border-radius: 4px; padding: 1px 6px; color: #6b7280; font-weight: 500; }
    .exp-note { font-size: 12px; color: #6b7280; margin-top: 2px; }
    .exp-time { font-size: 11px; color: #aaa; margin-top: 2px; }
    .exp-amount { font-size: 14px; font-weight: 700; color: #1b3050; flex-shrink: 0; }
    .del-btn {
      width: 28px; height: 28px; border: none; background: transparent;
      cursor: pointer; border-radius: 6px; display: flex; align-items: center;
      justify-content: center; color: #c62828; transition: background 0.15s;
      flex-shrink: 0;
    }
    .del-btn:hover { background: #fdecea; }
    .del-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }

    /* Summary */
    .expense-total-bar { }
    .summary-grid { display: flex; flex-direction: column; gap: 0; }
    .summary-row {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 0; border-bottom: 1px solid #eef0f4;
    }
    .sum-icon {
      width: 28px; height: 28px; border-radius: 6px; display: flex;
      align-items: center; justify-content: center; flex-shrink: 0; background: #f4f6f9;
    }
    .sum-icon mat-icon { font-size: 15px; width: 15px; height: 15px; color: #6b7280; }
    .sum-icon.supplier_payment { background: #e3f2fd; } .sum-icon.supplier_payment mat-icon { color: #1565c0; }
    .sum-icon.tea { background: #fff8e1; } .sum-icon.tea mat-icon { color: #c9a84c; }
    .sum-icon.bus_fare { background: #e8f5e9; } .sum-icon.bus_fare mat-icon { color: #2e7d32; }
    .sum-icon.temp_worker { background: #fce4ec; } .sum-icon.temp_worker mat-icon { color: #c2185b; }
    .sum-icon.salary { background: #f3e5f5; } .sum-icon.salary mat-icon { color: #7b1fa2; }
    .sum-label { flex: 1; font-size: 13px; color: #1b3050; }
    .sum-amount { font-size: 14px; font-weight: 700; color: #1b3050; }
    .summary-total {
      display: flex; justify-content: space-between; padding: 10px 0 0;
      font-size: 14px; font-weight: 700; color: #1b3050;
    }
    .no-data { color: #6b7280; font-size: 13px; padding: 8px 0; }
    .month-picker { margin-bottom: 12px; }

    /* Supplier balances */
    .supplier-balance-row {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 0; border-bottom: 1px solid #eef0f4; font-size: 13px;
    }
    .supplier-balance-row mat-icon { color: #6b7280; font-size: 18px; width: 18px; height: 18px; }
    .sb-name { flex: 1; color: #1b3050; font-weight: 500; }
    .sb-amount { font-weight: 700; }
    .sb-amount.owed { color: #c62828; }
    .sb-amount.clear { color: #2e7d32; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 40px; color: #6b7280; gap: 8px;
    }
    .empty-state mat-icon { font-size: 36px; width: 36px; height: 36px; }
    .empty-state p { font-size: 14px; }

    .delivery-hint {
      display: flex; align-items: flex-start; gap: 8px;
      margin-top: 12px; padding: 10px 14px; border-radius: 8px;
      background: #fff8e1; color: #7b5800; font-size: 12px; line-height: 1.5;
    }
    .delivery-hint mat-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
    .ledger-link {
      color: #1565c0; cursor: pointer; text-decoration: underline; font-weight: 600;
    }

    @media (max-width: 767px) {
      .page-container { padding: 12px; max-width: 100%; }
      .page-header { flex-direction: column; gap: 8px; }
      .quick-grid { flex-direction: column; }
      .filter-row { flex-wrap: wrap; gap: 8px; }
      .exp-row, .expense-row { flex-wrap: wrap; gap: 6px; }
      .summary-card { padding: 12px !important; }
    }
  `]
})
export class ExpensesComponent implements OnInit {
  private expenseService = inject(ExpenseService);
  private supplierService = inject(SupplierService);
  private spService = inject(SalespersonService);
  private twService = inject(TempWorkerService);
  private snack = inject(MatSnackBar);
  private router = inject(Router);
  auth = inject(AuthService);

  selectedDate = new Date().toISOString().split('T')[0];
  selectedMonth = new Date().toISOString().substring(0, 7);

  expenses: Expense[] = [];
  suppliers: Supplier[] = [];
  salespersons: Salesperson[] = [];
  tempWorkers: TempWorker[] = [];
  dailySummary: Record<string, number> = {};
  monthlySummary: Record<string, number> = {};

  // Form states
  sp = { supplierId: undefined as number | undefined, amount: undefined as number | undefined, note: '' };
  bf = { salespersonId: undefined as number | undefined, amount: 300, note: 'Bus fare - deduct from salary' };
  tw = { workerId: undefined as number | undefined, note: '', amount: 1500 };
  sal = { salespersonId: undefined as number | undefined, amount: undefined as number | undefined, note: '' };
  other = { note: '', amount: undefined as number | undefined };

  selectedSupplier: Supplier | undefined;

  get dayTotal() { return this.expenses.reduce((s, e) => s + e.amount, 0); }
  get dailyTotal() { return Object.values(this.dailySummary).reduce((s, v) => s + v, 0); }
  get monthlyTotal() { return Object.values(this.monthlySummary).reduce((s, v) => s + v, 0); }
  get suppliersWithBalance() { return this.suppliers.filter(s => s.balance !== undefined); }

  objectKeys = Object.keys;

  ngOnInit() {
    this.supplierService.getAll().subscribe(s => this.suppliers = s);
    this.spService.getAll().subscribe(s => this.salespersons = s);
    this.twService.getAll().subscribe(w => this.tempWorkers = w);
    this.load();
  }

  load() {
    this.expenseService.getByDate(this.selectedDate).subscribe(e => this.expenses = e);
    this.expenseService.getDailySummary(this.selectedDate).subscribe(s => this.dailySummary = s);
    this.loadMonthly();
  }

  onDateChange() { this.load(); }

  loadMonthly() {
    const [year, month] = this.selectedMonth.split('-').map(Number);
    const from = `${year}-${String(month).padStart(2,'0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${String(month).padStart(2,'0')}-${lastDay}`;
    this.expenseService.getMonthlySummary(from, to).subscribe(s => this.monthlySummary = s);
  }

  onSupplierSelect() {
    this.selectedSupplier = this.suppliers.find(s => s.id === Number(this.sp.supplierId));
  }

  getCatLabel(cat: string) { return CATEGORY_LABELS[cat as ExpenseCategory] ?? cat; }
  getCatIcon(cat: string) { return CATEGORY_ICONS[cat as ExpenseCategory] ?? 'receipt'; }

  quickAdd(category: ExpenseCategory, amount: number, note: string) {
    this.expenseService.create({ category, amount, note, expenseDate: this.selectedDate })
      .subscribe(() => { this.snack.open(`${note} agregado`, '', { duration: 1500 }); this.load(); });
  }

  addSupplierPayment() {
    if (!this.sp.supplierId || !this.sp.amount) return;
    this.expenseService.create({
      category: 'SUPPLIER_PAYMENT', amount: this.sp.amount,
      note: this.sp.note || undefined, supplierId: this.sp.supplierId,
      expenseDate: this.selectedDate
    }).subscribe(() => {
      this.snack.open('Pago al proveedor registrado', '', { duration: 1500 });
      this.sp = { supplierId: undefined, amount: undefined, note: '' };
      this.selectedSupplier = undefined;
      this.supplierService.getAll().subscribe(s => this.suppliers = s);
      this.load();
    });
  }

  goToDeliveries() {
    this.router.navigate(['/shop-supplies']);
  }

  goToLedger(supplier: Supplier) {
    this.router.navigate(['/shop-supplies'], { queryParams: { supplierId: supplier.id } });
  }

  addBusFare() {
    if (!this.bf.salespersonId || !this.bf.amount) return;
    this.expenseService.create({
      category: 'BUS_FARE', amount: this.bf.amount,
      note: this.bf.note || undefined, salespersonId: this.bf.salespersonId,
      expenseDate: this.selectedDate
    }).subscribe(() => {
      this.snack.open('Pasaje agregado', '', { duration: 1500 });
      this.bf = { salespersonId: undefined, amount: 300, note: 'Bus fare - deduct from salary' };
      this.load();
    });
  }

  addDaySalaryWorker() {
    if (!this.tw.workerId || !this.tw.amount) return;
    const worker = this.tempWorkers.find(w => w.id === Number(this.tw.workerId));
    this.expenseService.create({
      category: 'TEMP_WORKER', amount: this.tw.amount,
      note: this.tw.note || worker?.name,
      expenseDate: this.selectedDate
    }).subscribe(() => {
      this.snack.open('Salario diario registrado', '', { duration: 1500 });
      this.tw = { workerId: undefined, note: '', amount: 1500 };
      this.load();
    });
  }

  addSalary() {
    if (!this.sal.salespersonId || !this.sal.amount) return;
    this.expenseService.create({
      category: 'SALARY', amount: this.sal.amount,
      note: this.sal.note || undefined, salespersonId: this.sal.salespersonId,
      expenseDate: this.selectedDate
    }).subscribe(() => {
      this.snack.open('Salario registrado', '', { duration: 1500 });
      this.sal = { salespersonId: undefined, amount: undefined, note: '' };
      this.load();
    });
  }

  addOther() {
    if (!this.other.note || !this.other.amount) return;
    this.expenseService.create({
      category: 'OTHER', amount: this.other.amount, note: this.other.note,
      expenseDate: this.selectedDate
    }).subscribe(() => {
      this.snack.open('Gasto agregado', '', { duration: 1500 });
      this.other = { note: '', amount: undefined };
      this.load();
    });
  }

  deleteExpense(e: Expense) {
    const ref = this.snack.open(
      `¿Eliminar ${this.getCatLabel(e.category)} por Rs ${e.amount}?`,
      'Eliminar',
      { duration: 4000 }
    );
    ref.onAction().subscribe(() => {
      this.expenseService.delete(e.id).subscribe(() => {
        this.snack.open('Gasto eliminado', '', { duration: 1500 });
        this.supplierService.getAll().subscribe(s => this.suppliers = s);
        this.load();
      });
    });
  }
}
