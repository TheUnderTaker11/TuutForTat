import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TutorlistPage } from './tutorlist.page';

const routes: Routes = [
  {
    path: '',
    component: TutorlistPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TutorlistPageRoutingModule {}
