import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {LngLat, Popup} from "mapbox-gl";
import {AccidentProperties} from "../models/accidentProperties";
import {MapboxService} from "../map-service/mapbox.service";

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PopupComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input() lngLat!: LngLat;
  @Input() data!: AccidentProperties;

  @ViewChild('popupContent', { static: true }) content!: ElementRef;

  constructor(private readonly mapboxService: MapboxService) { }

  ngOnInit(): void {
    // const map = this.mapboxService.getMap();
    // if (!map) return;
    // const popupInstance = new Popup();
    // popupInstance.setDOMContent(this.content.nativeElement);
    // popupInstance.setLngLat(this.lngLat);
    // popupInstance.addTo(map);
    //
    // popupInstance.on('close', () => this.mapboxService.popupActive$.next(false))

  }

  ngAfterViewInit() {
    const map = this.mapboxService.getMap();
    if (!map) return;
    const popupInstance = new Popup();
    popupInstance.setDOMContent(this.content.nativeElement);
    popupInstance.setLngLat(this.lngLat);
    popupInstance.addTo(map);
  }

  ngOnDestroy() {
    console.log('destroyed')
  }

}
