import { Component, OnInit } from '@angular/core';
import { FormGroup,FormControl,Validators,ValidatorFn, AbstractControl } from '@angular/forms';
import { SignupComponent } from '../signup/signup.component';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit{

  loginForm : FormGroup;
  users: any[] = [];
  constructor(private http: HttpClient,private router:Router){}
  ngOnInit(){
    this.loginForm=new FormGroup(
      {
        email: new FormControl('',[Validators.required,Validators.email]),
        password: new FormControl('',[Validators.required,Validators.minLength(8),this.passwordvalidator()])
      });
  }hide=false;
  passwordvalidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const password = control.value;
      const hasSpecialChars = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[a-zA-Z\d!@#$%^&*(),.?":{}|<>]{8,}$/.test(password);
      return hasSpecialChars ? null : { 'hasSpecialChars': { value: control.value } };
    };
  }

  onLogin(){
   
    if (this.loginForm.valid && this.loginForm.controls['password'].errors === null) {
      const email = this.loginForm.get('email').value;
    const password = this.loginForm.get('password').value;

    this.http.get<any[]>('http://localhost:5000/details').subscribe(users => {
      this.users = users;
      const user = this.users.find(u => u.email === email && u.password === password);
      if (user) {
        this.router.navigate(['./filein']);
      } else {
        window.alert('Invalid credentials entered!');
      }
    });
    }
      
  }
}
      
      

    
  
  


