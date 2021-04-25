import { Component } from '@angular/core';
import { AngularFireModule } from '@angular/fire';
import {environment} from '../environments/environment';
import {NotificationsService} from './notifications.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(public notificationsService: NotificationsService
    ) { }


  async ngOnInit() {
    AngularFireModule.initializeApp(environment.firebaseConfig);
    await this.notificationsService.init();
  }
}
