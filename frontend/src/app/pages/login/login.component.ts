import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute,Router } from '@angular/router';
import { map, Subject, takeUntil } from 'rxjs';

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

  constructor(
    private fb: FormBuilder,
    private loginService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
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
      .pipe(
        takeUntil(this.destroyed$),
        map(params => params['returnUrl'])
      )
      .subscribe(url => {
        this.returnUrl = url;
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

    const { username, password } = this.loginForm.value;

    this.loginService.login(username, password).subscribe({
      next: () => {
        this.router.navigate([this.returnUrl ? this.returnUrl : '/']);
      },
      error: (err: Error) => {
        this.loginError = err.message;
      }
    });
  }


}
