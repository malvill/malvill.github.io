import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { LayerVisibility } from '../types/layerVisibility';

@Component({
  selector: 'app-filter-layers',
  templateUrl: './filter-layers.component.html',
  styleUrls: ['./filter-layers.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterLayersComponent {

  @Input() layersIds: string[] = [];
  @Output() onLayerVisibilityChange: EventEmitter<LayerVisibility> = new EventEmitter<LayerVisibility>()

  toggleLayerView(event: Event) {
    const isVisible = (<HTMLInputElement>event.target).checked;

    this.onLayerVisibilityChange.next({
      layerId: (<HTMLInputElement>event.target).name,
      visible: isVisible
    })
  }
}
