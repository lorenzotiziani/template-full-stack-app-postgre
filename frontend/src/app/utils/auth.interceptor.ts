import { inject } from '@angular/core';
import {
    HttpHandlerFn,
    HttpRequest,
    HttpErrorResponse,
    HttpClient
} from '@angular/common/http';
import { JwtService } from '../services/jwt.service';
import { Router } from '@angular/router';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
    const jwtService = inject(JwtService);
    const router = inject(Router);
    const http = inject(HttpClient);

    // Non intercettare le route di autenticazione
    if (req.url.includes('/api/auth/login') ||
        req.url.includes('/api/auth/register') ||
        req.url.includes('/api/auth/activate')) {
        return next(req);
    }

    const authTokens = jwtService.getToken();

    // Senza token lascia passare: il backend risponderà 401
    if (!authTokens) {
        return next(req).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === 401) {
                    jwtService.removeToken();
                    router.navigate(['/login'], {
                        queryParams: { reason: 'no_token' }
                    });
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

            // 401: access token scaduto o invalido, provo il refresh
            if (error.status === 401) {
                const refreshToken = authTokens.refreshToken;

                if (refreshToken && jwtService.isRefreshTokenValid()) {
                    return http.post<{ success: boolean; data: { accessToken: string; refreshToken: string } }>(
                        'http://localhost:3000/api/auth/refresh',
                        { refreshToken }
                    ).pipe(
                        switchMap((response) => {
                            jwtService.setToken(response.data.accessToken, response.data.refreshToken);

                            // Riprova la richiesta originale con il nuovo access token
                            const retryReq = req.clone({
                                setHeaders: { Authorization: `Bearer ${response.data.accessToken}` }
                            });

                            return next(retryReq);
                        }),
                        catchError(() => {
                            jwtService.removeToken();
                            router.navigate(['/login'], {
                                queryParams: { reason: 'session_expired' }
                            });

                            return throwError(() => new Error('Sessione scaduta'));
                        })
                    );
                }

                jwtService.removeToken();
                router.navigate(['/login'], {
                    queryParams: { reason: 'no_refresh_token' }
                });
                return throwError(() => new Error('Autenticazione richiesta'));
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