import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import {MapboxService} from "../map-service/mapbox.service";
import {LngLat, LngLatLike, MapLayerMouseEvent, Popup} from "mapbox-gl";
import {AccidentProperties} from "../utils/accidentProperties";
import {LayerVisibility} from "../utils/layerVisibility";
import {FeatureCollection, Point} from "geojson";


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
  private readonly style = 'mapbox://styles/mapbox/streets-v11';
  // private readonly markerIconUrl = 'https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png';
  private readonly initialZoom: number = 0;
  private readonly centerCoords: LngLatLike = [50, 50];
  private readonly boundsPadding: number = 50;
  private initialGeojsonData!: FeatureCollection<Point, AccidentProperties>;

  @ViewChild('map') private readonly mapElement!: ElementRef;
  @ViewChild("popup") private readonly popupElement!: ElementRef;

  constructor(private readonly mapboxService: MapboxService) {}

  public ngOnInit(): void {
    this.mapboxService.loadData();
  }

  public ngAfterViewInit(): void {
    this.mapboxService.data$.subscribe((data: FeatureCollection<Point, AccidentProperties>) => {
      this.initialGeojsonData = data;

      this.map = new mapboxgl.Map({
        container: this.mapElement.nativeElement,
        style: this.style,
        zoom: this.initialZoom,
        center: this.centerCoords
      });

      this.map.on('load', () => {
        this.loadMapData();
      })
    })
  }

  private loadMapData() {


    this.map.loadImage('https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png', (err, img) => {
      this.defineBounds();
      // @ts-ignore
      this.map.addImage('custom-marker', img);
      this.addSource();
      this.createLayers();

      for (const layerId of this.layersIds) {
        this.map.on('click', layerId,(event: MapLayerMouseEvent) => this.generatePopup(event))

        this.map.on('mouseenter', layerId, () => {
          this.map.getCanvas().style.cursor = 'pointer';
        });

        this.map.on('mouseleave', layerId, () => {
          this.map.getCanvas().style.cursor = '';
        });
      }
    })
  }

  private defineBounds(): void {
    const coordinates = this.initialGeojsonData.features[0].geometry.coordinates;
    const bounds = new mapboxgl.LngLatBounds(
      [coordinates[0], coordinates[1]],
      [coordinates[0], coordinates[1]]
    );

    for (const feature of this.initialGeojsonData.features) {
      bounds.extend([feature.geometry.coordinates[0], feature.geometry.coordinates[1]]);
    }

    this.map.fitBounds(bounds, {
      padding: this.boundsPadding
    });
  }

  createLayers() {
    const tempLayersIds = []

    for (const feature of this.initialGeojsonData.features) {
      const accidentType = feature.properties.type;

      if (!this.map.getLayer(accidentType)) {
        tempLayersIds.push(accidentType);
        this.addFilteredLayer(accidentType);
      }
    }

    this.listenForLayersVisibilityChange();
    this.layersIds = tempLayersIds;
  }

  private generatePopup(event: MapLayerMouseEvent): void {
    const eventFirstFeature = event.features![0];

    if (eventFirstFeature.geometry.type !== 'Point') {
      return;
    }

    const coordinates = eventFirstFeature.geometry.coordinates.slice();
    const properties = eventFirstFeature.properties;

    while (Math.abs(event.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += event.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    const popupInstance = new Popup();
    popupInstance.setDOMContent(this.popupElement.nativeElement);
    popupInstance.setLngLat(coordinates as LngLatLike);
    popupInstance.addTo(this.map);
    this.popupData = properties as AccidentProperties;
  }

  addSource() {
    this.map.addSource('roadAccidents', {
      type: 'geojson',
      data: this.initialGeojsonData
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
      .subscribe((layerChange: LayerVisibility) => {
        this.map.setLayoutProperty(
          layerChange.layerId,
          'visibility',
          layerChange.visible ? 'visible' : 'none'
        );
      })
  }

}
