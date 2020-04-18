import { Timeline, GlobalTime, StepTimeline } from './time.js'

type PropertyTimeline = [string, Timeline];

export class EntityManager {
  private scene: BABYLON.Scene;
  private timelines: Map<string, PropertyTimeline[]>;

  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
    this.timelines = new Map();
  
    this.scene.registerBeforeRender(this.update.bind(this));
  }

  addEntity(entityName: string, entity: Object): void {
    if (this.timelines.has(entityName)) {
      throw new Error('Entity already exists.');
    }

    let propertyTimelines = Object.keys(entity).map(propertyName => {
      let timeline = this.toStepTimeline(entity[propertyName], `${entityName}.${propertyName}`);

      return <PropertyTimeline>[propertyName, timeline];
    });

    this.timelines.set(entityName, propertyTimelines);
  }

  update(): void {
    GlobalTime.freeze();

    this.timelines.forEach((propertyTimelines: PropertyTimeline[], entityName: string) => {
      let mesh: any = this.scene.getMeshByName(entityName);
      
      if (!mesh) {
        return;
      }

      propertyTimelines.forEach(([propertyName, timeline]) => {
        let value = timeline.get(0);

        if (propertyName === 'elevation') {
          mesh.elevation = value; 
        }
      });
    });

    GlobalTime.unfreeze();
  }

  evaluate(entityName: string): Object {
    if (!this.timelines.has(entityName)) {
      throw new Error(`Entity "${entityName}" is not known by entity manager.`);
    }

    let result = {};

    GlobalTime.freeze();
    this.timelines.get(entityName).forEach(([propertyName, timeline]) => {
      result[propertyName] = timeline.get(0);
    });
    GlobalTime.unfreeze();

    return result;
  }

  private toStepTimeline(timeValues: [number, any][], name: string): StepTimeline {
    let timeline = new StepTimeline(null, name);

    timeValues.forEach(([t, v]) => timeline.set(t, v, false));

    return timeline;
  }
}