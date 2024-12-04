import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-navbar',
    imports: [RouterModule, NgIf],
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.css'
})
export class NavbarComponent {

  isMobileMenuOpen = false;

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

}
