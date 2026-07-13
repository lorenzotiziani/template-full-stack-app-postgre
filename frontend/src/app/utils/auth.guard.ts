import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { JwtService } from '../services/jwt.service';

export const authGuard: CanActivateFn = (route, state) => {
    const jwtService = inject(JwtService);
    const router = inject(Router);

    // Basta un refresh token valido: l'access token verrà rinnovato dall'interceptor
    const isAuthenticated = jwtService.isAuthenticated();

    if (isAuthenticated) {
        return true;
    }

    // Non autenticato: pulisci eventuali token invalidi e redirigi al login
    jwtService.removeToken();

    router.navigate(['/login'], {
        queryParams: {
            returnUrl: state.url,
            reason: 'unauthorized'
        }
    });

    return false;
};