import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, distinctUntilChanged, map, Observable, of, ReplaySubject, tap, throwError } from 'rxjs';
import { JwtService } from './jwt.service';
import { User } from '../entities/User';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

interface LoginResponse {
    success: boolean;
    data: {
        user: User;
        accessToken: string;
        refreshToken: string;
    };
    error?: string;
}

interface RefreshResponse {
    success: boolean;
    data: {
        accessToken: string;
        refreshToken: string;
    };
}

interface RegisterResponse {
    success: boolean;
    data: {
        message: string;
        user: User;
    };
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly API_URL = environment.apiUrl;

    protected http = inject(HttpClient);
    protected jwtSrv = inject(JwtService);
    protected router = inject(Router);

    // ReplaySubject(1) emette l'ultimo valore ai nuovi subscriber
    private _currentUser$ = new ReplaySubject<User | null>(1);
    public currentUser$ = this._currentUser$.asObservable();

    public isAuthenticated$ = this.currentUser$.pipe(
        map(user => !!user),
        distinctUntilChanged()
    );

    constructor() {
        this.initializeAuth();
    }

    private initializeAuth(): void {
        // Senza un refresh token valido l'utente non è autenticato
        if (!this.jwtSrv.areTokensValid()) {
            this._currentUser$.next(null);
            return;
        }

        // Token valido: recupero il profilo completo dal server
        // (un eventuale access token scaduto viene rinnovato dall'interceptor)
        this.fetchUser().subscribe();
    }

    login(email: string, password: string): Observable<User> {
        return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, {
            email,
            password
        }).pipe(
            tap(res => {
                if (!res.success) {
                    throw new Error(res.error || 'Login fallito');
                }
            }),
            tap(res => {
                this.jwtSrv.setToken(res.data.accessToken, res.data.refreshToken);
                this._currentUser$.next(res.data.user);
            }),
            map(res => res.data.user),
            catchError((error) => {
                this._currentUser$.next(null);

                const backendMessage =
                    error?.error?.message ||
                    error?.error?.error ||
                    'Errore di autenticazione';

                return throwError(() => new Error(backendMessage));
            })

        );
    }

    register(userData: {
        email: string;
        password: string;
        confirm: string;
        nome: string;
        cognome: string;
    }): Observable<RegisterResponse> {
        return this.http.post<RegisterResponse>(`${this.API_URL}/auth/register`, userData).pipe(
            catchError(error => {
                const backendError = error?.error;

                if (backendError?.details) {
                    return throwError(() => backendError.details);
                }

                if (backendError?.error) {
                    return throwError(() => backendError.error);
                }

                return throwError(() => 'Errore di connessione');
            })
        );
    }

    refresh(): Observable<RefreshResponse> {
        const authTokens = this.jwtSrv.getToken();

        if (!authTokens) {
            return throwError(() => new Error('Nessun refresh token disponibile'));
        }

        return this.http.post<RefreshResponse>(`${this.API_URL}/auth/refresh`, {
            refreshToken: authTokens.refreshToken
        }).pipe(
            tap(res => {
                if (res.success) {
                    this.jwtSrv.setToken(res.data.accessToken, res.data.refreshToken);
                }
            }),
            catchError(error => {
                this.performLogout();
                return throwError(() => error);
            })
        );
    }

    // Ricarica i dati dell'utente dal server senza forzare un nuovo login
    fetchUser(): Observable<User | null> {
        return this.http.get<{ success: boolean; data: User }>(`${this.API_URL}/users/profile`).pipe(
            map(res => res.data),
            tap(user => this._currentUser$.next(user)),
            catchError(() => {
                this._currentUser$.next(null);
                return of(null);
            })
        );
    }

    logout(): Observable<void> {
        const authTokens = this.jwtSrv.getToken();

        if (!authTokens) {
            this.performLogout();
            return of(void 0);
        }

        // Revoca il refresh token sul server, poi pulisce comunque lo stato locale
        return this.http.post<void>(`${this.API_URL}/auth/logout`, {
            refreshToken: authTokens.refreshToken
        }).pipe(
            tap(() => this.performLogout()),
            catchError(() => {
                this.performLogout();
                return of(void 0);
            })
        );
    }

    private performLogout(): void {
        this.jwtSrv.removeToken();
        this._currentUser$.next(null);
        this.router.navigate(['/login']);
    }

    getCurrentUser(): User | null {
        return this.jwtSrv.getPayload<User>();
    }

    isAuthenticated(): boolean {
        return this.jwtSrv.isAuthenticated();
    }

    getCurrentUserEmail(): string | null {
        const user = this.getCurrentUser();
        return user?.email || null;
    }
}