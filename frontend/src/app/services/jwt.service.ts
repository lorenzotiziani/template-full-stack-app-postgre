import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  userId: number;
  email: string;
  exp: number;
  iat: number;
}

@Injectable({
  providedIn: 'root'
})
export class JwtService {
  private readonly ACCESS_TOKEN_KEY = 'authToken';
  private readonly REFRESH_TOKEN_KEY = 'authRefreshToken';

  // Decodifica il payload dell'access token
  getPayload<T = DecodedToken>(): T | null {
    const authTokens = this.getToken();
    if (!authTokens || !this.isJwt(authTokens.token)) {
      return null;
    }

    try {
      return jwtDecode<T>(authTokens.token);
    } catch (e) {
      console.error('Failed to decode access token', e);
      return null;
    }
  }

  // Valida il refresh token (l'access token può essere scaduto e verrà rinnovato)
  areTokensValid(): boolean {
    const authTokens = this.getToken();
    if (!authTokens) {
      return false;
    }

    if (!this.isJwt(authTokens.refreshToken)) {
      return false;
    }

    try {
      const decoded: any = jwtDecode(authTokens.refreshToken);
      return !decoded.exp || decoded.exp * 1000 > Date.now();
    } catch (e) {
      console.error('Invalid refresh token', e);
      return false;
    }
  }

  isAccessTokenValid(): boolean {
    const authTokens = this.getToken();
    if (!authTokens || !this.isJwt(authTokens.token)) {
      return false;
    }

    try {
      const decoded: any = jwtDecode(authTokens.token);
      return !decoded.exp || decoded.exp * 1000 > Date.now();
    } catch (e) {
      console.error('Invalid access token', e);
      return false;
    }
  }

  isRefreshTokenValid(): boolean {
    return this.areTokensValid();
  }

  getToken(): { token: string; refreshToken: string } | null {
    const token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);

    if (!token || !refreshToken) {
      return null;
    }

    return { token, refreshToken };
  }

  setToken(token: string, refreshToken: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  removeToken(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return this.areTokensValid();
  }

  // Secondi mancanti alla scadenza dell'access token
  getAccessTokenTimeToExpire(): number | null {
    const authTokens = this.getToken();
    if (!authTokens || !this.isJwt(authTokens.token)) {
      return null;
    }

    try {
      const decoded: any = jwtDecode(authTokens.token);
      const now = Date.now() / 1000;
      const timeToExpire = decoded.exp - now;

      return timeToExpire > 0 ? timeToExpire : 0;
    } catch (error) {
      return null;
    }
  }

  getUserData(): DecodedToken | null {
    return this.getPayload<DecodedToken>();
  }

  private isJwt(token: string): boolean {
    return !!token && token.split('.').length === 3;
  }
}