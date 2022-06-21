import { Component, Input } from '@angular/core';
import {MapboxService} from '../map-service/mapbox.service';

@Component({
  selector: 'app-filter-layers',
  templateUrl: './filter-layers.component.html',
  styleUrls: ['./filter-layers.component.scss']
})
export class FilterLayersComponent {

  @Input() layersIds: string[] = [];

  constructor(private readonly mapService: MapboxService) {}

  toggleLayerView(event: Event) {
    const isVisible = (<HTMLInputElement>event.target).checked;

    this.mapService.layerVisibilityChanged$.next({
      layerId: (<HTMLInputElement>event.target).name,
      visible: isVisible
    })
  }
}
