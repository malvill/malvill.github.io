import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { GeojsonService } from '../map-service/geojson.service';
import { Expression, LngLatLike, MapLayerMouseEvent, Popup } from 'mapbox-gl';
import { AccidentProperties } from '../types/accidentProperties';
import { LayerVisibility } from '../types/layerVisibility';
import { FeatureCollection, Point } from 'geojson';
import { environment } from '../../environments/environment';


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, AfterViewInit {
  public map!: mapboxgl.Map;
  public popupData?: AccidentProperties;
  public layersIds: string[] = [];
  private markerIconFallback: boolean = false;
  private initialGeojsonData!: FeatureCollection<Point, AccidentProperties>;
  private readonly style: string = 'mapbox://styles/mapbox/streets-v11';
  private readonly defaultMarkerIconUrl: string = 'https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png';
  private readonly fallbackMarkerconUrl: string = 'assets/marker-icon.png';
  private readonly defaultMarkerIconSize: Expression = ['interpolate', ['linear'], ['zoom'], 5, 0.5, 15, 2];
  private readonly fallbackMarkerIconSize: Expression = ['interpolate', ['linear'], ['zoom'], 5, 0.01, 15, 0.07];
  private readonly initialZoom: number = 0;
  private readonly centerCoords: LngLatLike = [50, 50];
  private readonly boundsPadding: number = 50;

  @ViewChild('map') private readonly mapElement!: ElementRef;
  @ViewChild("popup") private readonly popupElement!: ElementRef;

  constructor(private readonly mapboxService: GeojsonService) {}

  public ngOnInit(): void {
    (mapboxgl as any).accessToken = environment.mapbox.accessToken;
    this.mapboxService.loadData();
  }

  public ngAfterViewInit(): void {
    this.mapboxService.loadData().subscribe((data: FeatureCollection<Point, AccidentProperties>) => {
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

  private loadMapData(): void {
    this.map.loadImage(this.defaultMarkerIconUrl, (err, img) => {
      if (err) {
        this.markerIconFallback = true;
        this.map.loadImage(this.fallbackMarkerconUrl, (err, img) => {
          if (err) throw err;
          this.onImageLoaded(img as HTMLImageElement);
        })

        return;
      }
      this.onImageLoaded(img as HTMLImageElement)
    })
  }

  private onImageLoaded(img: HTMLImageElement): void {
    this.defineBounds();
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

  createLayers(): void {
    const tempLayersIds = []

    for (const feature of this.initialGeojsonData.features) {
      const accidentType = feature.properties.type;

      if (!this.map.getLayer(accidentType)) {
        tempLayersIds.push(accidentType);
        this.addFilteredLayer(accidentType);
      }
    }

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
    this.popupData = { id: eventFirstFeature.id, ...properties} as AccidentProperties;
  }

  addSource(): void {
    this.map.addSource('roadAccidents', {
      type: 'geojson',
      data: this.initialGeojsonData
    })
  }

  addFilteredLayer(layerId: string): void {
    this.map.addLayer({
      'id': layerId,
      'type': 'symbol',
      'source': 'roadAccidents',
      'layout': {
        'icon-image': 'custom-marker',
        'icon-allow-overlap': true,
        'icon-size': this.markerIconFallback ? this.fallbackMarkerIconSize : this.defaultMarkerIconSize
      },
      'filter': ['==', 'type', layerId]
    })
  }

  changeLayerVisibility(layerChange: LayerVisibility): void {
    this.map.setLayoutProperty(
      layerChange.layerId,
      'visibility',
      layerChange.visible ? 'visible' : 'none'
    );
  }

}
