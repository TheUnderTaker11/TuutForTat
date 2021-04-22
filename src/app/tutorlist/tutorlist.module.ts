import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TutorlistPageRoutingModule } from './tutorlist-routing.module';

import { TutorlistPage } from './tutorlist.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TutorlistPageRoutingModule
  ],
  declarations: [TutorlistPage]
})
export class TutorlistPageModule {}
