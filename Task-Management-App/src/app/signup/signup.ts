import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserProfile } from '../types';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css']
})
export class Signup {
  name = '';
  email = '';
  avatarPreview: string | null = null;
  nameError = '';
  emailError = '';

  constructor(private router: Router) {}

  validateName(): void {
    if (!this.name.trim()) {
      this.nameError = 'Name is required';
    } else if (this.name.trim().length < 2) {
      this.nameError = 'Name must be at least 2 characters';
    } else {
      this.nameError = '';
    }
  }

  validateEmail(): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.email.trim()) {
      this.emailError = 'Email is required';
    } else if (!emailRegex.test(this.email)) {
      this.emailError = 'Please enter a valid email';
    } else {
      this.emailError = '';
    }
  }

  isFormValid(): boolean {
    return !this.nameError && !this.emailError && this.name.trim() !== '' && this.email.trim() !== '';
  }

  onAvatarChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.avatarPreview = e.target?.result as string;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  signUp(): void {
    if (!this.isFormValid()) {
      return;
    }

    const user: UserProfile = {
      name: this.name.trim(),
      email: this.email.trim(),
      avatar: this.avatarPreview,
      loggedInAt: new Date().toISOString()
    };

    localStorage.setItem('taskflow_user', JSON.stringify(user));
    this.router.navigate(['/board']);
  }
}