import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

// Validator di gruppo: password e conferma devono coincidere
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
	const password = group.get('password')?.value;
	const confirm = group.get('confirm')?.value;
	return password === confirm ? null : { passwordMismatch: true };
}

@Component({
	selector: 'app-register',
	standalone: false,
	templateUrl: './register.component.html',
	styleUrls: ['./register.component.css']
})
export class RegisterComponent {

	registerForm: FormGroup;
	registerError: string = '';

	constructor(
		private fb: FormBuilder,
		private registerService: AuthService,
		private router: Router
	) {
		this.registerForm = this.fb.group({
			email: ['', [Validators.required, Validators.email]],
			password: ['', Validators.required],
			confirm: ['', Validators.required],
			nome: ['', Validators.required],
			cognome: ['', Validators.required]
		}, { validators: passwordsMatch });

	}

	register() {
		if (this.registerForm.invalid) return;

		const newUser = this.registerForm.value;

		this.registerService.register(newUser).subscribe({
			next: (res: any) => {
				if (!res.success) {
					this.registerError = res.error || 'Errore sconosciuto';
					return;
				}
				// La registrazione non effettua il login: si va alla pagina di accesso
				this.router.navigate(['/login'], { queryParams: { registered: '1' } });
			},
			error: (err: any) => {
				if (Array.isArray(err)) {
					// Il backend restituisce un array di errori di validazione
					this.registerError = err.map(e => e.message).join('\n');
				} else if (typeof err === 'string') {
					this.registerError = err;
				} else {
					this.registerError = 'Errore di connessione';
				}
			}

		});

	}
}
