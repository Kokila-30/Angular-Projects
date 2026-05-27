import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.html',
  styleUrls: ['./layout.css']
})
export class Layout implements OnInit {
  currentUser: any = null;

  constructor(private router: Router) {}

  ngOnInit() {
    if (typeof window !== 'undefined') {
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      if (!isLoggedIn || isLoggedIn !== 'true') {
        this.router.navigate(['/login']);
        return;
      }
      
      const user = localStorage.getItem('user');
      if (user) {
        this.currentUser = JSON.parse(user);
      } else {
        this.currentUser = { username: 'Admin' };
      }
    }
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('user');
    }
    this.router.navigate(['/login']);
  }
}