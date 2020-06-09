/// <reference types="react" />
import { Animated } from 'react-native';
import { RegisterViewPayload, UnregisterViewPayload, UpdateViewProtocolPayload, UpdateViewMeasurementsPayload, DraxViewData, DraxViewMeasurements, Position, DraxFoundAbsoluteViewEntry, StartDragPayload, DraxAbsoluteViewEntry, DraxAbsoluteViewData, DraxStateDispatch, DraxSnapbackTargetPreset } from '../types';
/** Create a Drax registry and wire up all of the methods. */
export declare const useDraxRegistry: (stateDispatch: DraxStateDispatch) => {
    getViewData: (id: string | undefined) => DraxViewData | undefined;
    getAbsoluteViewData: (id: string | undefined) => DraxAbsoluteViewData | undefined;
    getTrackingDragged: () => {
        tracking: import("../types").DraxTrackingDrag;
        id: string;
        data: DraxAbsoluteViewData;
    } | undefined;
    getTrackingReceiver: () => {
        tracking: import("../types").DraxTrackingReceiver;
        id: string;
        data: DraxAbsoluteViewData;
    } | undefined;
    getTrackingMonitorIds: () => string[];
    getTrackingMonitors: () => DraxAbsoluteViewEntry[];
    getDragPositionData: (parentPosition: Position, draggedMeasurements: DraxViewMeasurements) => {
        dragAbsolutePosition: {
            x: number;
            y: number;
        };
        dragTranslation: {
            x: number;
            y: number;
        };
        dragTranslationRatio: {
            x: number;
            y: number;
        };
    } | undefined;
    findMonitorsAndReceiver: (absolutePosition: Position, excludeViewId: string) => {
        monitors: DraxFoundAbsoluteViewEntry[];
        receiver: DraxFoundAbsoluteViewEntry | undefined;
    };
    getHoverItems: () => {
        internalRenderHoverView: (props: import("../types").DraxInternalRenderHoverViewProps) => import("react").ReactNode;
        key: string;
        id: string;
        hoverPosition: Animated.ValueXY;
        dimensions: {
            width: number;
            height: number; /** Get data for a registered view by its id. */
        };
    }[];
    registerView: (payload: RegisterViewPayload) => void;
    updateViewProtocol: (payload: UpdateViewProtocolPayload) => void;
    updateViewMeasurements: (payload: UpdateViewMeasurementsPayload) => void;
    resetReceiver: () => void;
    resetDrag: (snapbackTarget?: Position | DraxSnapbackTargetPreset | undefined) => void;
    startDrag: (payload: StartDragPayload) => {
        dragAbsolutePosition: Position;
        dragTranslation: {
            x: number;
            y: number;
        };
        dragTranslationRatio: {
            x: number;
            y: number;
        };
        dragOffset: Position;
        hoverPosition: Animated.ValueXY;
    };
    updateDragPosition: (dragAbsolutePosition: Position) => void;
    updateReceiver: (receiver: DraxFoundAbsoluteViewEntry, dragged: DraxAbsoluteViewEntry) => import("../types").DraxTrackingReceiver | undefined;
    setMonitorIds: (monitorIds: string[]) => void;
    unregisterView: (payload: UnregisterViewPayload) => void;
};
