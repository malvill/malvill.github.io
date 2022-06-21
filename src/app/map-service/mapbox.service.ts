import {Injectable, OnInit} from '@angular/core';
import * as mapboxgl from "mapbox-gl";
import {environment} from "../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {BehaviorSubject, map, Subject, take} from "rxjs";
import {Feature, FeatureCollection, Position, Point} from 'geojson';
import {AccidentProperties} from "../utils/accidentProperties";
import { LayerVisibility } from "../utils/layerVisibility";


@Injectable({
  providedIn: 'root'
})
export class MapboxService implements OnInit {
  public layerVisibilityChanged$ = new Subject<LayerVisibility>();
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
