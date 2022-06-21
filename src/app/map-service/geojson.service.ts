import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, take } from 'rxjs';
import { FeatureCollection, Point } from 'geojson';
import { AccidentProperties } from '../types/accidentProperties';


@Injectable({
  providedIn: 'root'
})
export class GeojsonService {
  constructor(private readonly http: HttpClient) {}

  public loadData(): Observable<FeatureCollection<Point, AccidentProperties>> {
    return this.http
      .get<FeatureCollection<Point, AccidentProperties>>('assets/road_accidents.geojson')
      .pipe(take(1))
  }

}
