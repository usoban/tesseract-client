// ======================================================================================
// The timeline.
// TODO: make timeline itself a fucking DLL. This will slightly reduce memory footprint
//      and probably quite nicely reduce the code size/complexity.
// ======================================================================================
import { DoubleLinkedList } from './dll.js';
// ====================================
// Global clock facility.
// ====================================
class GTime {
    constructor() {
        this.frozenTime = null;
        this.frozenCounter = 0;
        this.serverTimeOffset = 0;
    }
    /**
     * Computes current time in ms adjusted to the offset from the server.
     *
     * This means this method does not give current local time, but an adjustment
     * to be as close as possible to the server's local time.
     */
    getCurrentTime() {
        return Date.now() + this.serverTimeOffset;
    }
    /**
     * Returns the frozen value of the clock; if clock is currently not frozen, it
     * returns the current time.
     *
     * All times are adjusted for the offset from the server.
     */
    getCurrentFrozenTime() {
        if (this.frozenCounter > 0) {
            return this.frozenTime;
        }
        return this.getCurrentTime();
    }
    ;
    /**
     * Freezes the clock so that relative time does not change.
     *
     * This method is used at the start of Draw/Render method of the engine to freeze
     * the time used by ngRTS clock and ensure that all values retrieved from a timeline
     * using the get() method are relative to the same time point.
     *
     * This method must always be used in conjunction with unfreeze() method.
     */
    freeze() {
        if (this.frozenCounter === 0) {
            this.frozenTime = this.getCurrentTime();
        }
        this.frozenCounter++;
    }
    ;
    /**
     * Unfreezes the clock so that relative time updates.
     *
     * This method is used at the end of the draw/render method in the engine
     * to unfreeze the time used by the ngRTS clock.
     *
     * This method must always be used in conjunction with the freeze() method.
     */
    unfreeze() {
        this.frozenCounter--;
    }
    ;
    debug(description) {
        console.log('===> ', description);
        if (this.frozenCounter > 0) {
            console.log('Frozen clock: ', this.frozenTime);
        }
    }
}
export let GlobalTime = new GTime();
// Represents a value at given timepoint.
// Times are stored in absolute form (ms since epoch aka UNIX timestamp).
// However, the getter for property `t` returns the time in relative form
// (relative to the current time).
// Times are also adjusted by server time offset so that all times are based
// on server time.
class TimeValue {
    constructor(value = null, t = 0) {
        this.value = value;
        this._t = t;
    }
    get t() {
        return this._t - GlobalTime.getCurrentFrozenTime();
    }
    set t(t) {
        this._t = t + GlobalTime.getCurrentFrozenTime();
    }
    get realT() {
        return this._t;
    }
    set realT(realT) {
        this._t = realT;
    }
}
export class Timeline {
    constructor(object, name) {
        this.maxLength = 50;
        this.object = object;
        this.name = name;
        this.timeline = new DoubleLinkedList();
    }
    /**
     * Finds an element in the timeline with latest time before the given time.
     *
     * Returns null if there is no such element.
     *
     * TODO: support `sentToRemoteOnly`
     */
    valueBefore(t, sentToRemoteOnly = false) {
        let node = this.nodeBefore(t);
        return node.value;
    }
    nodeBefore(t) {
        let latestValueBefore = this.timeline.findBackwards((node) => {
            return node.value && node.value.t < t;
        });
        if (!latestValueBefore) {
            // TODO: either no values were sent before time t, or all values are after time t????
            return this.timeline.head;
        }
        return latestValueBefore;
    }
    /**
     * Returns the element with latest time before or at the given time.
     *
     * Returns null if there is no such element.
     */
    valueBeforeAt(t) {
        let latestValueBefore = this.timeline.find((node) => {
            return node.value && node.value.t > t;
        });
        if (latestValueBefore === null) {
            // TODO: all values were before t
            return null;
        }
        return latestValueBefore.prev.value;
    }
    /**
     * Returns the element with earliest time after the given time.
     */
    valueAfter(t) {
        let node = this.nodeAfter(t);
        return node.value;
    }
    nodeAfter(t) {
        let earliestValueAfter = this.timeline.findBackwards((node) => {
            return node.value && node.value.t < t; // TODO: should it be <= ???
        });
        if (earliestValueAfter === null) {
            // TODO: all values were after t
            return null;
        }
        return earliestValueAfter.next;
    }
    /**
     * Returns the value at time t if there is one; otherwise returns null.
     */
    valueAt(t) {
        let node = this.timeline.findBackwards((node) => {
            return node.value && node.value.t <= t;
        });
        if (node === null) {
            // TODO: all values were after t
            return null;
        }
        if (node.value.t === t) {
            return node.value;
        }
        return null;
    }
    lastValue() {
        return this.timeline.lastValue();
    }
    /**
     * Returns the next ground time after the given time.
     *
     * If there is no future ground time, returns t.
     */
    nextTime(t) {
        let nextTime, valueAfter;
        GlobalTime.freeze();
        valueAfter = this.valueAfter(t);
        if (valueAfter !== null) {
            nextTime = valueAfter.t;
        }
        else {
            nextTime = t;
        }
        GlobalTime.unfreeze();
        return nextTime;
    }
    /**
     * Returns the next ground time before the given time.
     * If there is no past ground time, returns t.
     */
    prevTime(t) {
        let prevTime, valueBefore;
        GlobalTime.freeze();
        valueBefore = this.valueBefore(t);
        if (valueBefore !== null) {
            prevTime = valueBefore.t;
        }
        else {
            prevTime = t;
        }
        GlobalTime.unfreeze();
        return prevTime;
    }
    /**
     * Returns true if the timeline is ready to be used (there is at least one value
     * in the timeline).
     *
     * Used to determine if the timeline contains any values. A timeline must
     * contain at least one value before the get() method can be used. It
     * returns true if there are values in the timeline, otherwise returns false.
     *
     * Its a good practice to call this method before using the get() method to
     * ensure that get() will not return an error.
     */
    ready() {
        return !this.timeline.isEmpty();
    }
    get(t) {
        let result, timeValue;
        if (!this.ready()) {
            throw new Error('Timeline [' + this.name + '] not ready.');
        }
        GlobalTime.freeze();
        timeValue = this.valueAt(t);
        if (timeValue !== null) {
            result = timeValue.value;
        }
        else {
            if (this.timeline.lastValue().t > t && this.timeline.firstValue().t < t) {
                if (this.interpolate !== null) {
                    // TODO: implement interpolations!!
                    result = this.interpolate(t);
                }
                else {
                    // If no interpolation is specified, return the previous value on the timeline.
                    // TODO: verify, but e.g. this may be when unit is not actually moving??
                    result = this.valueBefore(t).value;
                }
            }
            else if (this.timeline.firstValue().t > t) {
                // All values in the timeline are after t.
                result = this.timeline.firstValue().value;
            }
            else {
                // All values in the timeline are before t.
                if (this.extrapolate !== null) {
                    // TODO: implement extrapolations!!
                    result = this.extrapolate(t, false); // TODO: wtf is the second arg?
                }
                else {
                    // If no extrapolation is specified, return the last value in the timeline.
                    result = this.timeline.lastValue().value;
                }
            }
        }
        GlobalTime.unfreeze();
        return result;
    }
    /**
     * Returns a list of values for the given time range.
     */
    getRange(tStart, tEnd) {
        let resultList = [], nodeAfter;
        GlobalTime.freeze();
        nodeAfter = this.nodeAfter(tStart);
        while (nodeAfter !== null && nodeAfter.value.t <= tEnd) {
            resultList.push(nodeAfter.value);
            nodeAfter = nodeAfter.next;
        }
        GlobalTime.unfreeze();
        return resultList;
    }
    /**
     * Sets the value of the timeline at time t. Any previously set values later
     * than t are removed.
     *
     * @TODO: support sendToRemote!
     */
    set(t, value, sendToRemote = false) {
        let newTimeValue = new TimeValue(value, t), previousNodeOnTimeline;
        GlobalTime.freeze();
        // Find value whose time precedes t.
        // First, assume its most likely the last value in the list.
        if (this.timeline.isEmpty()) {
            this.timeline.append(newTimeValue);
        }
        else {
            previousNodeOnTimeline = this.timeline.tail;
            if (previousNodeOnTimeline.value.t > t) {
                previousNodeOnTimeline = this.nodeBefore(t);
            }
            this.timeline.insertAfterAndDisposeTail(previousNodeOnTimeline, newTimeValue);
        }
        if (this.timeline.length() > this.maxLength) {
            this.timeline.shortenFront();
        }
        // TODO: send to remote client through networking facility.
        // if (sendToRemote) {
        //   this.net.send({
        //     timeline: this.name,
        //     real_time: newTimeValue.realT,
        //     value: newTimeValue.value
        //   });
        // }
        GlobalTime.unfreeze();
    }
    setFromRemote(realTime, value) {
        let timeValue = new TimeValue(0, value);
        timeValue.realT = realTime;
        let prev = this.timeline.tail;
        if (prev === null) {
            // No values before this one.
            this.timeline.insertAfterAndDisposeTail(this.timeline.head, timeValue);
        }
        else {
            if (prev.value.realT > realTime) {
                prev = this.nodeBefore(timeValue.t);
            }
            this.timeline.insertAfterAndDisposeTail(prev, timeValue);
        }
    }
}
export class TimelinePosition3D extends Timeline {
    interpolate(t) {
        let prev = this.valueBefore(t), next = this.valueAfter(t), elapsedTime = next.t - prev.t, resultX, resultY, resultZ;
        resultX = (1.0 * (t - prev.t) / elapsedTime * next.value.x
            + 1.0 * (next.t - t) / elapsedTime * prev.value.x);
        resultY = (1.0 * (t - prev.t) / elapsedTime * next.value.y
            + 1.0 * (next.t - t) / elapsedTime * prev.value.y);
        resultZ = (1.0 * (t - prev.t) / elapsedTime * next.value.z
            + 1.0 * (next.t - t) / elapsedTime * prev.value.z);
        return new BABYLON.Vector3(resultX, resultY, resultZ);
    }
    extrapolate(t, sentToRemoteOnly) {
        let prev = this.valueBefore(t, sentToRemoteOnly), prevPrev = this.valueBefore(prev.t, sentToRemoteOnly), prevPosition = prev.value, prevPrevPosition, extrapolatedX, extrapolatedY, extrapolatedZ, velocityX, velocityY, velocityZ;
        if (prevPrev === null || prev.t === prevPrev.t) {
            extrapolatedX = prevPosition.x;
            extrapolatedY = prevPosition.y;
            extrapolatedZ = prevPosition.z;
        }
        else {
            prevPrevPosition = prevPrev.value;
            velocityX = ((1.0 * (prevPosition.x - prevPrevPosition.x)) /
                (1.0 * (prev.t - prevPrev.t)));
            velocityY = ((1.0 * (prevPosition.y - prevPrevPosition.y)) /
                (1.0 * (prev.t - prevPrev.t)));
            velocityZ = ((1.0 * (prevPosition.z - prevPrevPosition.z)) /
                (1.0 * (prev.t - prevPrev.t)));
            extrapolatedX = prevPosition.x + 1.0 * (velocityX * (t - prev.t));
            extrapolatedY = prevPosition.y + 1.0 * (velocityY * (t - prev.t));
            extrapolatedZ = prevPosition.z + 1.0 * (velocityZ * (t - prev.t));
        }
        // TODO
        return prevPosition;
        // return {x: extrapolatedX, y: extrapolatedY, z: extrapolatedZ};
    }
}
export class StepTimeline extends Timeline {
    /**
     * Interpolating step timeline means returning the value which was set before or at t, if there is any.
     */
    interpolate(t) {
        let valueBeforeOrAtT = this.valueBeforeAt(t);
        if (valueBeforeOrAtT) {
            return valueBeforeOrAtT.value;
        }
        return null;
    }
    /**
     * Extrapolating step timeline means simply returning the last value.
     */
    extrapolate(t) {
        let lastTimeValue = this.lastValue();
        if (lastTimeValue !== null) {
            return lastTimeValue.value;
        }
        return null;
    }
}
