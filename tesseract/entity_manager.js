import { GlobalTime, StepTimeline } from './time.js';
export class EntityManager {
    constructor(scene) {
        this.scene = scene;
        this.timelines = new Map();
        this.scene.registerBeforeRender(this.update.bind(this));
    }
    addEntity(entityName, entity) {
        if (this.timelines.has(entityName)) {
            throw new Error('Entity already exists.');
        }
        let propertyTimelines = Object.keys(entity).map(propertyName => {
            let timeline = this.toStepTimeline(entity[propertyName], `${entityName}.${propertyName}`);
            return [propertyName, timeline];
        });
        this.timelines.set(entityName, propertyTimelines);
    }
    update() {
        GlobalTime.freeze();
        this.timelines.forEach((propertyTimelines, entityName) => {
            let mesh = this.scene.getMeshByName(entityName);
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
    evaluate(entityName) {
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
    toStepTimeline(timeValues, name) {
        let timeline = new StepTimeline(null, name);
        timeValues.forEach(([t, v]) => timeline.set(t, v, false));
        return timeline;
    }
}
