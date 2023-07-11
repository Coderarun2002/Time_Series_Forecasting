import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { SignupComponent } from'./signup/signup.component';
import { LoginComponent } from './login/login.component';
import { FileinComponent } from './filein/filein.component';

const routes: Routes = [
  
  {
    path: '', component: LoginComponent
  },
  {
    path:'filein', component: FileinComponent
  },
  {
    path: 'signup', component: SignupComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
