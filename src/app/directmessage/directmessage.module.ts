import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DirectmessagePageRoutingModule } from './directmessage-routing.module';

import { DirectmessagePage } from './directmessage.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DirectmessagePageRoutingModule
  ],
  declarations: [DirectmessagePage]
})
export class DirectmessagePageModule {}
