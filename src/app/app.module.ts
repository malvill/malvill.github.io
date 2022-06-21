import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import {HttpClientModule} from "@angular/common/http";
import { PopupComponent } from './popup/popup.component';
import { FilterLayersComponent } from './filter-layers/filter-layers.component';

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    PopupComponent,
    FilterLayersComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
