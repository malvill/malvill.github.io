import {Injectable, OnInit} from '@angular/core';
import * as mapboxgl from "mapbox-gl";
import {environment} from "../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {BehaviorSubject, map, Subject, take} from "rxjs";
import {Feature, FeatureCollection, Position, Point} from 'geojson';
import {AccidentProperties} from "../models/accidentProperties";
import {layerVisibilityData} from "../map/map.component";


@Injectable({
  providedIn: 'root'
})
export class MapboxService implements OnInit {
  public layerVisibilityChanged$ = new Subject<layerVisibilityData>();
  public mapInstance?: mapboxgl.Map;
  public centerCoordinates$: BehaviorSubject<Position> = new BehaviorSubject<Position>([50, 50]);
  public data$: BehaviorSubject<FeatureCollection<Point, AccidentProperties>> = new BehaviorSubject<FeatureCollection<Point, AccidentProperties>>({
    "type": "FeatureCollection",
    "features": []
  });
  public popupActive$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);


  constructor(private readonly http: HttpClient) {
    (mapboxgl as any).accessToken = environment.mapbox.accessToken;
  }

  ngOnInit() {
    this.countCenterCoordinates();
  }

  createMap(options: any) {
    this.mapInstance = new mapboxgl.Map(options);

    return this.mapInstance;
  }

  getMap() {
    return this.mapInstance;
  }

  loadData() {
    this.http
      .get<FeatureCollection<Point, AccidentProperties>>('assets/road_accidents.geojson')
      .pipe(take(1))
      .subscribe((data: FeatureCollection<Point, AccidentProperties>) => this.data$.next(data));
  }

  countBounds() {
    return this.data$.pipe(map((data) => {
      console.log(data)
      const coordinates = data.features[0].geometry.coordinates;

      // Create a 'LngLatBounds' with both corners at the first coordinate.
      const bounds = new mapboxgl.LngLatBounds(
        [coordinates[0], coordinates[1]],
        [coordinates[0], coordinates[1]]
      );

      // Extend the 'LngLatBounds' to include every coordinate in the bounds result.
      for (const feature of data.features) {
        bounds.extend([feature.geometry.coordinates[0], feature.geometry.coordinates[1]]);
      }

      return bounds;
    }))
  }

  createPopup() {

  }


  // @ts-ignore
  removePopup(popup) {
    popup.remove();
  }





  countCenterCoordinates() {
    this.data$
      .pipe(
        map((geojsonObj: FeatureCollection<Point, AccidentProperties>): Array<Position> => {
          return geojsonObj.features.map((feature: Feature<Point, AccidentProperties>): Position => {
            return feature.geometry.coordinates
          })
        }),
        map((coordsArr: Array<Position>) => {
          const coordsSums: Position = coordsArr.reduce((previous: Position, current: Position): Position => {
            return [previous[0] + current[0], previous[1] + current[1]]
          });
          const coordsListLength = coordsArr.length;
          return coordsSums.map((coord: number): number => coord / coordsListLength)
        })
      ).subscribe((averageCoords: Position) => {
      this.centerCoordinates$.next(averageCoords);
    })
  }

}
