import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute,Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, OnDestroy {
  protected activatedRoute = inject(ActivatedRoute);
  protected destroyed$ = new Subject<void>();
  loginForm: FormGroup;
  loginError: string = '';
  // true quando si arriva dalla registrazione (?registered=1): mostra un avviso
  justRegistered = false;

  constructor(
    private fb: FormBuilder,
    private loginService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  // URL a cui tornare dopo il login (impostato dall'authGuard come queryParam 'returnUrl')
  returnUrl: string | null = null;
  ngOnInit() {
    this.loginForm.valueChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe(_ => {
        this.loginError = '';
      });

    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroyed$))
      .subscribe(params => {
        this.returnUrl = params['returnUrl'] ?? null;
        this.justRegistered = params['registered'] === '1';
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  login() {
    if (this.loginForm.invalid) {
      return;
    }

    const { email, password } = this.loginForm.value;

    this.loginService.login(email, password).subscribe({
      next: () => {
        this.router.navigate([this.returnUrl ? this.returnUrl : '/']);
      },
      error: (err: Error) => {
        this.loginError = err.message;
      }
    });
  }


}
