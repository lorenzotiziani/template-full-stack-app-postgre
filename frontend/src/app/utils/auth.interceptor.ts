import { inject } from '@angular/core';
import {
    HttpHandlerFn,
    HttpRequest,
    HttpErrorResponse,
    HttpClient,
    HttpEvent
} from '@angular/common/http';
import { JwtService } from '../services/jwt.service';
import { Router } from '@angular/router';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { BehaviorSubject, throwError, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Stato condiviso a livello di modulo per SERIALIZZARE il refresh:
// se più richieste vanno in 401 insieme, solo la prima fa il refresh,
// le altre aspettano il nuovo access token (niente token revocati a vicenda).
let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

interface RefreshResponse {
    success: boolean;
    data: { accessToken: string; refreshToken: string };
}

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
    const jwtService = inject(JwtService);
    const router = inject(Router);
    const http = inject(HttpClient);

    // Non intercettare le route di autenticazione.
    // IMPORTANTE: refresh e logout DEVONO essere qui, altrimenti un loro 401
    // farebbe ripartire il refresh su sé stesso → loop infinito di richieste.
    if (req.url.includes('/api/auth/login') ||
        req.url.includes('/api/auth/register') ||
        req.url.includes('/api/auth/activate') ||
        req.url.includes('/api/auth/refresh') ||
        req.url.includes('/api/auth/logout')) {
        return next(req);
    }

    const authTokens = jwtService.getToken();

    // Senza token lascia passare: il backend risponderà 401
    if (!authTokens) {
        return next(req).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === 401) {
                    jwtService.removeToken();
                    router.navigate(['/login'], { queryParams: { reason: 'no_token' } });
                }
                return throwError(() => error);
            })
        );
    }

    // Aggiungi l'access token alla richiesta
    const clonedReq = req.clone({
        setHeaders: { Authorization: `Bearer ${authTokens.token}` }
    });

    return next(clonedReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                return handle401(req, next, jwtService, router, http);
            }

            // 403: accesso negato
            if (error.status === 403) {
                router.navigate(['/unauthorized']);
                return throwError(() => error);
            }

            return throwError(() => error);
        })
    );
}

// Gestione del 401 con refresh serializzato.
function handle401(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
    jwtService: JwtService,
    router: Router,
    http: HttpClient
): Observable<HttpEvent<unknown>> {
    const tokens = jwtService.getToken();

    // Nessun refresh token valido → logout pulito
    if (!tokens?.refreshToken || !jwtService.isRefreshTokenValid()) {
        jwtService.removeToken();
        router.navigate(['/login'], { queryParams: { reason: 'session_expired' } });
        return throwError(() => new Error('Sessione scaduta'));
    }

    // Un refresh è già in corso: aspetto il nuovo token e ritento
    if (isRefreshing) {
        return refreshSubject.pipe(
            filter((token): token is string => token !== null),
            take(1),
            switchMap((token) =>
                next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))
            )
        );
    }

    // Sono il primo: avvio il refresh
    isRefreshing = true;
    refreshSubject.next(null);

    return http.post<RefreshResponse>(`${environment.apiUrl}/auth/refresh`, {
        refreshToken: tokens.refreshToken
    }).pipe(
        switchMap((response) => {
            jwtService.setToken(response.data.accessToken, response.data.refreshToken);
            isRefreshing = false;
            refreshSubject.next(response.data.accessToken);
            return next(req.clone({
                setHeaders: { Authorization: `Bearer ${response.data.accessToken}` }
            }));
        }),
        catchError(() => {
            isRefreshing = false;
            refreshSubject.next(null);
            jwtService.removeToken();
            router.navigate(['/login'], { queryParams: { reason: 'session_expired' } });
            return throwError(() => new Error('Sessione scaduta'));
        })
    );
}
