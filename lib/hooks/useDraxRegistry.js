"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDraxRegistry = void 0;
const react_1 = require("react");
const react_native_1 = require("react-native");
const v4_1 = __importDefault(require("uuid/v4"));
const useDraxState_1 = require("./useDraxState");
const types_1 = require("../types");
const math_1 = require("../math");
const params_1 = require("../params");
/*
 * The registry functions mutate their registry parameter, so let's
 * disable the "no parameter reassignment" rule for the entire file:
 */
/* eslint-disable no-param-reassign */
/** Create an initial empty Drax registry. */
const createInitialRegistry = (stateDispatch) => ({
    stateDispatch,
    viewIds: [],
    viewDataById: {},
    drag: undefined,
    releaseIds: [],
    releaseById: {},
});
/** Create the initial empty protocol data for a newly registered view. */
const createInitialProtocol = () => ({
    draggable: false,
    receptive: false,
    monitoring: false,
});
/** Get data for a registered view by its id. */
const getViewDataFromRegistry = (registry, id) => ((id && registry.viewIds.includes(id)) ? registry.viewDataById[id] : undefined);
/** Get absolute measurements for a registered view, incorporating parents and clipping. */
const getAbsoluteMeasurementsForViewFromRegistry = (registry, { measurements, parentId }, clipped = false) => {
    if (!measurements) {
        // console.log('Failed to get absolute measurements for view: no measurements');
        return undefined;
    }
    if (!parentId) {
        return measurements;
    }
    const parentViewData = getViewDataFromRegistry(registry, parentId);
    if (!parentViewData) {
        // console.log(`Failed to get absolute measurements for view: no view data for parent id ${parentId}`);
        return undefined;
    }
    const parentMeasurements = getAbsoluteMeasurementsForViewFromRegistry(registry, parentViewData, clipped);
    if (!parentMeasurements) {
        // console.log(`Failed to get absolute measurements for view: no absolute measurements for parent id ${parentId}`);
        return undefined;
    }
    const { x, y, width, height, } = measurements;
    const { x: parentX, y: parentY, } = parentMeasurements;
    const { x: offsetX, y: offsetY } = parentViewData.scrollPositionRef?.current || { x: 0, y: 0 };
    const abs = {
        width,
        height,
        x: parentX + x - offsetX,
        y: parentY + y - offsetY,
    };
    return clipped ? math_1.clipMeasurements(abs, parentMeasurements) : abs;
};
/** Get data, including absolute measurements, for a registered view by its id. */
const getAbsoluteViewDataFromRegistry = (registry, id) => {
    const viewData = getViewDataFromRegistry(registry, id);
    if (!viewData) {
        // console.log(`No view data for id ${id}`);
        return undefined;
    }
    const absoluteMeasurements = getAbsoluteMeasurementsForViewFromRegistry(registry, viewData);
    if (!absoluteMeasurements) {
        // console.log(`No absolute measurements for id ${id}`);
        return undefined;
    }
    return {
        ...viewData,
        measurements: viewData.measurements,
        absoluteMeasurements,
    };
};
/** Convenience function to return a view's id and absolute data. */
const getAbsoluteViewEntryFromRegistry = (registry, id) => {
    if (id === undefined) {
        return undefined;
    }
    const data = getAbsoluteViewDataFromRegistry(registry, id);
    return data && { id, data };
};
/**
 * Find all monitoring views and the latest receptive view that
 * contain the touch coordinates, excluding the specified view.
 */
const findMonitorsAndReceiverInRegistry = (registry, absolutePosition, excludeViewId) => {
    const monitors = [];
    let receiver;
    // console.log(`find monitors and receiver for absolute position (${absolutePosition.x}, ${absolutePosition.y})`);
    registry.viewIds.forEach((targetId) => {
        // console.log(`checking target id ${targetId}`);
        if (targetId === excludeViewId) {
            // Don't consider the excluded view.
            // console.log('excluded');
            return;
        }
        const target = getViewDataFromRegistry(registry, targetId);
        if (!target) {
            // This should never happen, but just in case.
            // console.log('no view data found');
            return;
        }
        const { receptive, monitoring } = target.protocol;
        if (!receptive && !monitoring) {
            // Only consider receptive or monitoring views.
            // console.log('not receptive nor monitoring');
            return;
        }
        const absoluteMeasurements = getAbsoluteMeasurementsForViewFromRegistry(registry, target, true);
        if (!absoluteMeasurements) {
            // Only consider views for which we have absolute measurements.
            // console.log('failed to find absolute measurements');
            return;
        }
        // console.log(`absolute measurements: ${JSON.stringify(absoluteMeasurements, null, 2)}`);
        if (math_1.isPointInside(absolutePosition, absoluteMeasurements)) {
            // Drag point is within this target.
            const foundView = {
                id: targetId,
                data: {
                    ...target,
                    measurements: target.measurements,
                    absoluteMeasurements,
                },
                ...math_1.getRelativePosition(absolutePosition, absoluteMeasurements),
            };
            if (monitoring) {
                // Add it to the list of monitors.
                monitors.push(foundView);
                // console.log('it\'s a monitor');
            }
            if (receptive) {
                // It's the latest receiver found.
                receiver = foundView;
                // console.log('it\'s a receiver');
            }
        }
    });
    return {
        monitors,
        receiver,
    };
};
/** Get id and data for the currently dragged view, if any. */
const getTrackingDraggedFromRegistry = (registry) => {
    const tracking = registry.drag;
    if (tracking !== undefined) {
        const viewEntry = getAbsoluteViewEntryFromRegistry(registry, tracking.draggedId);
        if (viewEntry !== undefined) {
            return {
                ...viewEntry,
                tracking,
            };
        }
    }
    return undefined;
};
/** Get id and data for the currently receiving view, if any. */
const getTrackingReceiverFromRegistry = (registry) => {
    const tracking = registry.drag?.receiver;
    if (tracking !== undefined) {
        const viewEntry = getAbsoluteViewEntryFromRegistry(registry, tracking.receiverId);
        if (viewEntry !== undefined) {
            return {
                ...viewEntry,
                tracking,
            };
        }
    }
    return undefined;
};
/** Get ids for all currently monitoring views. */
const getTrackingMonitorIdsFromRegistry = (registry) => (registry.drag?.monitorIds || []);
/** Get id and data for all currently monitoring views. */
const getTrackingMonitorsFromRegistry = (registry) => (registry.drag?.monitorIds
    .map((id) => getAbsoluteViewEntryFromRegistry(registry, id))
    .filter((value) => !!value)
    || []);
/** Get the array of hover items for dragged and released views */
const getHoverItemsFromRegistry = (registry) => {
    const hoverItems = [];
    // Find all released view hover items, in order from oldest to newest.
    registry.releaseIds.forEach((releaseId) => {
        const release = registry.releaseById[releaseId];
        if (release) {
            const { viewId, hoverPosition } = release;
            const releasedData = getAbsoluteViewDataFromRegistry(registry, viewId);
            if (releasedData) {
                const { protocol: { internalRenderHoverView }, measurements } = releasedData;
                if (internalRenderHoverView) {
                    hoverItems.push({
                        hoverPosition,
                        internalRenderHoverView,
                        key: releaseId,
                        id: viewId,
                        dimensions: math_1.extractDimensions(measurements),
                    });
                }
            }
        }
    });
    // Find the currently dragged hover item.
    const { id: draggedId, data: draggedData } = getTrackingDraggedFromRegistry(registry) ?? {};
    if (draggedData) {
        const { protocol: { internalRenderHoverView }, measurements } = draggedData;
        if (draggedId && internalRenderHoverView) {
            hoverItems.push({
                internalRenderHoverView,
                key: `dragged-hover-${draggedId}`,
                id: draggedId,
                hoverPosition: registry.drag.hoverPosition,
                dimensions: math_1.extractDimensions(measurements),
            });
        }
    }
    return hoverItems;
};
/**
 * Get the absolute position of a drag already in progress from touch
 * coordinates within the immediate parent view of the dragged view.
 */
const getDragPositionDataFromRegistry = (registry, parentPosition, draggedMeasurements) => {
    if (!registry.drag) {
        return undefined;
    }
    /*
     * To determine drag position in absolute coordinates, we add:
     *   absolute coordinates of drag start
     *   + translation offset of drag
     */
    const { absoluteStartPosition, parentStartPosition } = registry.drag;
    const dragTranslation = {
        x: parentPosition.x - parentStartPosition.x,
        y: parentPosition.y - parentStartPosition.y,
    };
    const dragTranslationRatio = {
        x: dragTranslation.x / draggedMeasurements.width,
        y: dragTranslation.y / draggedMeasurements.height,
    };
    const dragAbsolutePosition = {
        x: absoluteStartPosition.x + dragTranslation.x,
        y: absoluteStartPosition.y + dragTranslation.y,
    };
    return {
        dragAbsolutePosition,
        dragTranslation,
        dragTranslationRatio,
    };
};
/** Register a Drax view. */
const registerViewInRegistry = (registry, { id, parentId, scrollPositionRef }) => {
    const { viewIds, viewDataById, stateDispatch } = registry;
    // Make sure not to duplicate registered view id.
    if (viewIds.indexOf(id) < 0) {
        viewIds.push(id);
    }
    // Maintain any existing view data.
    const existingData = getViewDataFromRegistry(registry, id);
    // console.log(`Register view ${id} with parent ${parentId}`);
    viewDataById[id] = {
        parentId,
        scrollPositionRef,
        protocol: existingData?.protocol ?? createInitialProtocol(),
        measurements: existingData?.measurements,
    };
    stateDispatch(useDraxState_1.actions.createViewState({ id }));
};
/** Update a view's protocol callbacks/data. */
const updateViewProtocolInRegistry = (registry, { id, protocol }) => {
    const existingData = getViewDataFromRegistry(registry, id);
    if (existingData) {
        registry.viewDataById[id].protocol = protocol;
    }
};
/** Update a view's measurements. */
const updateViewMeasurementsInRegistry = (registry, { id, measurements }) => {
    const existingData = getViewDataFromRegistry(registry, id);
    if (existingData) {
        // console.log(`Update ${id} measurements: @(${measurements?.x}, ${measurements?.y}) ${measurements?.width}x${measurements?.height}`);
        registry.viewDataById[id].measurements = measurements;
    }
};
/** Reset the receiver in drag tracking, if any. */
const resetReceiverInRegistry = ({ drag, stateDispatch }) => {
    if (!drag) {
        return;
    }
    const { draggedId, receiver } = drag;
    if (!receiver) {
        // console.log('no receiver to clear');
        return;
    }
    // console.log('clearing receiver');
    drag.receiver = undefined;
    stateDispatch(useDraxState_1.actions.updateTrackingStatus({ receiving: false }));
    stateDispatch(useDraxState_1.actions.updateViewState({
        id: draggedId,
        viewStateUpdate: {
            draggingOverReceiver: undefined,
        },
    }));
    stateDispatch(useDraxState_1.actions.updateViewState({
        id: receiver.receiverId,
        viewStateUpdate: {
            receiveStatus: types_1.DraxViewReceiveStatus.Inactive,
            receiveOffset: undefined,
            receiveOffsetRatio: undefined,
            receivingDrag: undefined,
        },
    }));
};
/** Track a new release, returning its unique identifier. */
const createReleaseInRegistry = (registry, release) => {
    const releaseId = v4_1.default();
    registry.releaseIds.push(releaseId);
    registry.releaseById[releaseId] = release;
    return releaseId;
};
/** Stop tracking a release, given its unique identifier. */
const deleteReleaseInRegistry = (registry, releaseId) => {
    registry.releaseIds = registry.releaseIds.filter((id) => id !== releaseId);
    delete registry.releaseById[releaseId];
};
/** Reset drag tracking, if any. */
const resetDragInRegistry = (registry, snapbackTarget = types_1.DraxSnapbackTargetPreset.Default) => {
    const { drag, stateDispatch } = registry;
    if (!drag) {
        return;
    }
    resetReceiverInRegistry(registry);
    const { draggedId, hoverPosition } = drag;
    const draggedData = getAbsoluteViewDataFromRegistry(registry, draggedId);
    // Clear the drag.
    // console.log('clearing drag');
    registry.drag = undefined;
    // Determine if/where/how to snapback.
    let snapping = false;
    if (snapbackTarget !== types_1.DraxSnapbackTargetPreset.None && draggedData) {
        const { internalRenderHoverView, onSnapbackEnd, animateSnapback = true, snapbackDelay = params_1.defaultSnapbackDelay, snapbackDuration = params_1.defaultSnapbackDuration, } = draggedData.protocol;
        if (internalRenderHoverView && animateSnapback) {
            let toValue;
            if (types_1.isPosition(snapbackTarget)) {
                // Snapback to specified target.
                toValue = snapbackTarget;
            }
            else {
                // Snapback to default position (where original view is).
                toValue = {
                    x: draggedData.absoluteMeasurements.x,
                    y: draggedData.absoluteMeasurements.y,
                };
            }
            if (toValue && snapbackDuration > 0) {
                snapping = true;
                // Add a release to tracking.
                const releaseId = createReleaseInRegistry(registry, { hoverPosition, viewId: draggedId });
                // Animate the released hover snapback.
                react_native_1.Animated.timing(hoverPosition, {
                    toValue,
                    delay: snapbackDelay,
                    duration: snapbackDuration,
                    useNativeDriver: true,
                }).start(({ finished }) => {
                    // Remove the release from tracking, regardless of whether animation finished.
                    deleteReleaseInRegistry(registry, releaseId);
                    // Call the snapback end handler, regardless of whether animation of finished.
                    onSnapbackEnd?.();
                    // If the animation finished, update the view state for the released view to be inactive.
                    if (finished) {
                        stateDispatch(useDraxState_1.actions.updateViewState({
                            id: draggedId,
                            viewStateUpdate: {
                                dragStatus: types_1.DraxViewDragStatus.Inactive,
                                hoverPosition: undefined,
                                grabOffset: undefined,
                                grabOffsetRatio: undefined,
                            },
                        }));
                    }
                });
            }
        }
    }
    // Update the drag tracking status.
    stateDispatch(useDraxState_1.actions.updateTrackingStatus({ dragging: false }));
    // Update the view state, data dependent on whether snapping back.
    const viewStateUpdate = {
        dragAbsolutePosition: undefined,
        dragTranslation: undefined,
        dragTranslationRatio: undefined,
        dragOffset: undefined,
    };
    if (snapping) {
        viewStateUpdate.dragStatus = types_1.DraxViewDragStatus.Released;
    }
    else {
        viewStateUpdate.dragStatus = types_1.DraxViewDragStatus.Inactive;
        viewStateUpdate.hoverPosition = undefined;
        viewStateUpdate.grabOffset = undefined;
        viewStateUpdate.grabOffsetRatio = undefined;
    }
    stateDispatch(useDraxState_1.actions.updateViewState({
        viewStateUpdate,
        id: draggedId,
    }));
};
/** Start tracking a drag. */
const startDragInRegistry = (registry, { dragAbsolutePosition, dragParentPosition, draggedId, grabOffset, grabOffsetRatio, }) => {
    const { stateDispatch } = registry;
    resetDragInRegistry(registry);
    const dragTranslation = { x: 0, y: 0 };
    const dragTranslationRatio = { x: 0, y: 0 };
    const dragOffset = grabOffset;
    const hoverPosition = new react_native_1.Animated.ValueXY({
        x: dragAbsolutePosition.x - grabOffset.x,
        y: dragAbsolutePosition.y - grabOffset.y,
    });
    registry.drag = {
        absoluteStartPosition: dragAbsolutePosition,
        parentStartPosition: dragParentPosition,
        draggedId,
        dragAbsolutePosition,
        dragTranslation,
        dragTranslationRatio,
        dragOffset,
        grabOffset,
        grabOffsetRatio,
        hoverPosition,
        receiver: undefined,
        monitorIds: [],
    };
    stateDispatch(useDraxState_1.actions.updateTrackingStatus({ dragging: true }));
    stateDispatch(useDraxState_1.actions.updateViewState({
        id: draggedId,
        viewStateUpdate: {
            dragAbsolutePosition,
            dragTranslation,
            dragTranslationRatio,
            dragOffset,
            grabOffset,
            grabOffsetRatio,
            hoverPosition,
            dragStatus: types_1.DraxViewDragStatus.Dragging,
        },
    }));
    return {
        dragAbsolutePosition,
        dragTranslation,
        dragTranslationRatio,
        dragOffset,
        hoverPosition,
    };
};
/** Update drag position. */
const updateDragPositionInRegistry = (registry, dragAbsolutePosition) => {
    const { drag, stateDispatch } = registry;
    if (!drag) {
        return;
    }
    const { absoluteMeasurements } = getTrackingDraggedFromRegistry(registry)?.data ?? {};
    if (!absoluteMeasurements) {
        return;
    }
    const { draggedId, grabOffset, hoverPosition } = drag;
    const dragTranslation = {
        x: dragAbsolutePosition.x - drag.absoluteStartPosition.x,
        y: dragAbsolutePosition.y - drag.absoluteStartPosition.y,
    };
    const dragTranslationRatio = {
        x: dragTranslation.x / absoluteMeasurements.width,
        y: dragTranslation.y / absoluteMeasurements.height,
    };
    const dragOffset = {
        x: dragAbsolutePosition.x - absoluteMeasurements.x,
        y: dragAbsolutePosition.y - absoluteMeasurements.y,
    };
    drag.dragAbsolutePosition = dragAbsolutePosition;
    drag.dragTranslation = dragTranslation;
    drag.dragTranslationRatio = dragTranslationRatio;
    drag.dragOffset = dragOffset;
    hoverPosition.setValue({
        x: dragAbsolutePosition.x - grabOffset.x,
        y: dragAbsolutePosition.y - grabOffset.y,
    });
    stateDispatch(useDraxState_1.actions.updateViewState({
        id: draggedId,
        viewStateUpdate: {
            dragAbsolutePosition,
            dragTranslation,
            dragTranslationRatio,
            dragOffset,
        },
    }));
};
/** Update receiver for a drag. */
const updateReceiverInRegistry = (registry, receiver, dragged) => {
    const { drag, stateDispatch } = registry;
    if (!drag) {
        return undefined;
    }
    const { relativePosition, relativePositionRatio, id: receiverId, data: receiverData, } = receiver;
    const { parentId: receiverParentId, protocol: { receiverPayload }, } = receiverData;
    const { id: draggedId, data: draggedData, } = dragged;
    const { parentId: draggedParentId, protocol: { dragPayload }, } = draggedData;
    const oldReceiver = drag.receiver;
    const receiveOffset = relativePosition;
    const receiveOffsetRatio = relativePositionRatio;
    const receiverUpdate = {
        receivingDrag: {
            id: draggedId,
            parentId: draggedParentId,
            payload: dragPayload,
        },
        receiveOffset,
        receiveOffsetRatio,
    };
    if (oldReceiver?.receiverId === receiverId) {
        // Same receiver, update offsets.
        oldReceiver.receiveOffset = receiveOffset;
        oldReceiver.receiveOffsetRatio = receiveOffsetRatio;
    }
    else {
        // New receiver.
        if (oldReceiver) {
            // Clear the old receiver.
            resetReceiverInRegistry(registry);
        }
        drag.receiver = {
            receiverId,
            receiveOffset,
            receiveOffsetRatio,
        };
        receiverUpdate.receiveStatus = types_1.DraxViewReceiveStatus.Receiving;
        stateDispatch(useDraxState_1.actions.updateTrackingStatus({ receiving: true }));
    }
    stateDispatch(useDraxState_1.actions.updateViewState({
        id: receiverId,
        viewStateUpdate: receiverUpdate,
    }));
    stateDispatch(useDraxState_1.actions.updateViewState({
        id: draggedId,
        viewStateUpdate: {
            draggingOverReceiver: {
                id: receiverId,
                parentId: receiverParentId,
                payload: receiverPayload,
            },
        },
    }));
    return drag.receiver;
};
/** Set the monitors for a drag. */
const setMonitorIdsInRegistry = ({ drag }, monitorIds) => {
    if (drag) {
        drag.monitorIds = monitorIds;
    }
};
/** Unregister a Drax view. */
const unregisterViewInRegistry = (registry, { id }) => {
    const { [id]: removed, ...viewDataById } = registry.viewDataById;
    registry.viewIds = registry.viewIds.filter((thisId) => thisId !== id);
    registry.viewDataById = viewDataById;
    if (registry.drag?.draggedId === id) {
        resetDragInRegistry(registry);
    }
    else if (registry.drag?.receiver?.receiverId === id) {
        resetReceiverInRegistry(registry);
    }
    registry.stateDispatch(useDraxState_1.actions.deleteViewState({ id }));
};
/** Create a Drax registry and wire up all of the methods. */
exports.useDraxRegistry = (stateDispatch) => {
    /** Registry for tracking views and drags. */
    const registryRef = react_1.useRef(createInitialRegistry(stateDispatch));
    /** Ensure that the registry has the latest version of state dispatch, although it should never change. */
    react_1.useEffect(() => {
        registryRef.current.stateDispatch = stateDispatch;
    }, [stateDispatch]);
    /**
     *
     * Getters/finders, with no state reactions.
     *
     */
    /** Get data for a registered view by its id. */
    const getViewData = react_1.useCallback((id) => getViewDataFromRegistry(registryRef.current, id), []);
    /** Get data, including absolute measurements, for a registered view by its id. */
    const getAbsoluteViewData = react_1.useCallback((id) => getAbsoluteViewDataFromRegistry(registryRef.current, id), []);
    /** Get id and data for the currently dragged view, if any. */
    const getTrackingDragged = react_1.useCallback(() => getTrackingDraggedFromRegistry(registryRef.current), []);
    /** Get id and data for the currently receiving view, if any. */
    const getTrackingReceiver = react_1.useCallback(() => getTrackingReceiverFromRegistry(registryRef.current), []);
    /** Get ids for all currently monitoring views. */
    const getTrackingMonitorIds = react_1.useCallback(() => getTrackingMonitorIdsFromRegistry(registryRef.current), []);
    /** Get id and data for all currently monitoring views. */
    const getTrackingMonitors = react_1.useCallback(() => getTrackingMonitorsFromRegistry(registryRef.current), []);
    /**
     * Get the absolute position of a drag already in progress from touch
     * coordinates within the immediate parent view of the dragged view.
     */
    const getDragPositionData = react_1.useCallback((parentPosition, draggedMeasurements) => (getDragPositionDataFromRegistry(registryRef.current, parentPosition, draggedMeasurements)), []);
    /**
     * Find all monitoring views and the latest receptive view that
     * contain the touch coordinates, excluding the specified view.
     */
    const findMonitorsAndReceiver = react_1.useCallback((absolutePosition, excludeViewId) => (findMonitorsAndReceiverInRegistry(registryRef.current, absolutePosition, excludeViewId)), []);
    /** Get the array of hover items for dragged and released views */
    const getHoverItems = react_1.useCallback(() => getHoverItemsFromRegistry(registryRef.current), []);
    /**
     *
     * Imperative methods without state reactions (data management only).
     *
     */
    /** Update a view's protocol callbacks/data. */
    const updateViewProtocol = react_1.useCallback((payload) => updateViewProtocolInRegistry(registryRef.current, payload), []);
    /** Update a view's measurements. */
    const updateViewMeasurements = react_1.useCallback((payload) => updateViewMeasurementsInRegistry(registryRef.current, payload), []);
    /**
     *
     * Imperative methods with potential state reactions.
     *
     */
    /** Register a Drax view. */
    const registerView = react_1.useCallback((payload) => registerViewInRegistry(registryRef.current, payload), []);
    /** Reset the receiver in drag tracking, if any. */
    const resetReceiver = react_1.useCallback(() => resetReceiverInRegistry(registryRef.current), []);
    /** Reset drag tracking, if any. */
    const resetDrag = react_1.useCallback((snapbackTarget) => resetDragInRegistry(registryRef.current, snapbackTarget), []);
    /** Start tracking a drag. */
    const startDrag = react_1.useCallback((payload) => startDragInRegistry(registryRef.current, payload), []);
    /** Update drag position. */
    const updateDragPosition = react_1.useCallback((dragAbsolutePosition) => (updateDragPositionInRegistry(registryRef.current, dragAbsolutePosition)), []);
    /** Update the receiver for a drag. */
    const updateReceiver = react_1.useCallback((receiver, dragged) => (updateReceiverInRegistry(registryRef.current, receiver, dragged)), []);
    /** Set the monitors for a drag. */
    const setMonitorIds = react_1.useCallback((monitorIds) => setMonitorIdsInRegistry(registryRef.current, monitorIds), []);
    /** Unregister a Drax view. */
    const unregisterView = react_1.useCallback((payload) => unregisterViewInRegistry(registryRef.current, payload), []);
    /** Create the Drax registry object for return, only replacing reference when necessary. */
    const draxRegistry = react_1.useMemo(() => ({
        getViewData,
        getAbsoluteViewData,
        getTrackingDragged,
        getTrackingReceiver,
        getTrackingMonitorIds,
        getTrackingMonitors,
        getDragPositionData,
        findMonitorsAndReceiver,
        getHoverItems,
        registerView,
        updateViewProtocol,
        updateViewMeasurements,
        resetReceiver,
        resetDrag,
        startDrag,
        updateDragPosition,
        updateReceiver,
        setMonitorIds,
        unregisterView,
    }), [
        getViewData,
        getAbsoluteViewData,
        getTrackingDragged,
        getTrackingReceiver,
        getTrackingMonitorIds,
        getTrackingMonitors,
        getDragPositionData,
        findMonitorsAndReceiver,
        getHoverItems,
        registerView,
        updateViewProtocol,
        updateViewMeasurements,
        resetReceiver,
        resetDrag,
        startDrag,
        updateDragPosition,
        updateReceiver,
        setMonitorIds,
        unregisterView,
    ]);
    return draxRegistry;
};
