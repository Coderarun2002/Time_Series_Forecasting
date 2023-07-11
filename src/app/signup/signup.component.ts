import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  loginForm: FormGroup;
  

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
        this.passwordvalidator(),
      ]),
    });

    
  }

  passwordvalidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const password = control.value;
      const hasSpecialChars = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[a-zA-Z\d!@#$%^&*(),.?":{}|<>]{8,}$/.test(
        password
      );
      return hasSpecialChars ? null : { hasSpecialChars: { value: control.value } };
    };
  }hide=false

  onsignup() {
    if (this.loginForm.valid && this.loginForm.controls['password'].errors === null) {
      const email = this.loginForm.get('email').value;
      const password = this.loginForm.get('password').value;
      const data = { email: email, password: password };
      this.http.post('http://localhost:5000/details', data).subscribe();
      alert('User added successfully');
      }
    }
  }

  
  




