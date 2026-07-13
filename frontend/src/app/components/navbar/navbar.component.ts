import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  // Esposto al template per lo stato reattivo (isAuthenticated$ | async) e l'email utente
  protected authSrv = inject(AuthService);

  // Stato apertura menu su mobile (Bootstrap JS non è incluso, gestiamo noi il collapse)
  isMenuOpen = false;

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  logout(): void {
    this.authSrv.logout().subscribe();
    this.closeMenu();
  }
}
