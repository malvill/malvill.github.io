import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import {MapboxService} from "../map-service/mapbox.service";
import {LngLat, MapLayerMouseEvent, Popup} from "mapbox-gl";
import {AccidentProperties} from "../models/accidentProperties";

export type layerVisibilityData = {
  layerId: string,
  visible: boolean
}


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, AfterViewInit {
  public accidentLngLat?: LngLat;
  public accidentData?: AccidentProperties;
  // @ts-ignore
  public popupData?;
  public layersIds: string[] = [];
  map!: mapboxgl.Map;
  style = 'mapbox://styles/mapbox/streets-v11';

  @ViewChild('map') mapElement!: ElementRef;
  @ViewChild("popup") popupContainer!: ElementRef;

  constructor(private readonly mapboxService: MapboxService) {
  }

  ngOnInit() {
    this.mapboxService.loadData();

    // this.mapboxService
    //   .popupActive$.subscribe((popupActive: boolean) => this.popupActive = popupActive)
  }

  ngAfterViewInit() {
    this.map = this.mapboxService.createMap({
      container: this.mapElement.nativeElement,
      style: this.style,
      zoom: 0,
      center: [50, 50]
    })

    this.map.on('load', () => {
      this.loadMapData();
    })
  }

  private getBounds() {
    this.mapboxService.countBounds()
      .subscribe((bounds) => {
        this.map.fitBounds(bounds, {
          padding: 50
        });
      });
  }

  private loadMapData() {
    this.getBounds();

    this.map.loadImage('https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png', (_, img) => {
      // @ts-ignore
      this.map.addImage('custom-marker', img);
      this.addSource();

      this.mapboxService.countBounds();

      const data = this.mapboxService.data$.getValue().features;

      const tempLayersIds = []

      for (const feature of data) {
        const accidentType = feature.properties.type;

        if (!this.map.getLayer(accidentType)) {
          tempLayersIds.push(accidentType);
          this.addFilteredLayer(accidentType);
        }
      }

      this.listenForLayersVisibilityChange();
      this.layersIds = tempLayersIds;

      for (const layerId of this.layersIds) {
        this.map.on('click', layerId,(e: MapLayerMouseEvent) => {
          // @ts-ignore
          const coordinates = e.features![0].geometry.coordinates.slice();
          const properties = e.features![0].properties;

          // Ensure that if the map is zoomed out such that multiple
          // copies of the feature are visible, the popup appears
          // over the copy being pointed to.
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          this.mapboxService.popupActive$.next(true);

          this.accidentLngLat = coordinates;
          console.log(this.accidentLngLat)
          this.accidentData = properties as AccidentProperties;

          const popupInstance = new Popup();
          popupInstance.setDOMContent(this.popupContainer.nativeElement);
          popupInstance.setLngLat(coordinates);
          popupInstance.addTo(this.map);
          this.popupData = properties as AccidentProperties;
        })

        this.map.on('mouseenter', layerId, () => {
          this.map.getCanvas().style.cursor = 'pointer';
        });

// Change it back to a pointer when it leaves.
        this.map.on('mouseleave', layerId, () => {
          this.map.getCanvas().style.cursor = '';
        });
      }




    })
  }

  addSource() {
    this.map.addSource("roadAccidents", {
      type: "geojson",
      data: "assets/road_accidents.geojson"
    })
  }

  addFilteredLayer(layerId: string) {
    this.map.addLayer({
      'id': layerId,
      'type': 'symbol',
      'source': 'roadAccidents',
      'layout': {
        'icon-image': 'custom-marker',
        'icon-allow-overlap': true,
        'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.5, 15, 2]
      },
      'filter': ['==', 'type', layerId]
    })
  }

  listenForLayersVisibilityChange() {
    this.mapboxService.layerVisibilityChanged$
      .subscribe((layerChange: layerVisibilityData) => {
        this.map.setLayoutProperty(
          layerChange.layerId,
          'visibility',
          layerChange.visible ? 'visible' : 'none'
        );
      })
  }

}
