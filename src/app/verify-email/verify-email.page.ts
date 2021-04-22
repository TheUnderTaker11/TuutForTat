import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from "../../shared/authentication-service";

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.page.html',
  styleUrls: ['./verify-email.page.scss'],
})
export class VerifyEmailPage implements OnInit {

  constructor(
    public authService: AuthenticationService,
    public router: Router,
  ) { }

  ngOnInit() {
  }

  redirectToLogin(){
    this.router.navigateByUrl('login');
  }
}