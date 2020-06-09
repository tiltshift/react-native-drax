"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DraxView = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_gesture_handler_1 = require("react-native-gesture-handler");
const v4_1 = __importDefault(require("uuid/v4"));
const lodash_throttle_1 = __importDefault(require("lodash.throttle"));
const useDrax_1 = require("./useDrax");
const types_1 = require("./types");
const params_1 = require("./params");
const DraxSubprovider_1 = require("./DraxSubprovider");
const math_1 = require("./math");
exports.DraxView = ({ onDragStart, onDrag, onDragEnter, onDragOver, onDragExit, onDragEnd, onDragDrop, onSnapbackEnd, onReceiveDragEnter, onReceiveDragOver, onReceiveDragExit, onReceiveDragDrop, onMonitorDragStart, onMonitorDragEnter, onMonitorDragOver, onMonitorDragExit, onMonitorDragEnd, onMonitorDragDrop, animateSnapback, snapbackDelay, snapbackDuration, payload, dragPayload, receiverPayload, style, dragInactiveStyle, draggingStyle, draggingWithReceiverStyle, draggingWithoutReceiverStyle, dragReleasedStyle, hoverStyle, hoverDraggingStyle, hoverDraggingWithReceiverStyle, hoverDraggingWithoutReceiverStyle, hoverDragReleasedStyle, receiverInactiveStyle, receivingStyle, otherDraggingStyle, otherDraggingWithReceiverStyle, otherDraggingWithoutReceiverStyle, renderContent, renderHoverContent, registration, onMeasure, scrollPositionRef, children, noHover = false, isParent = false, longPressDelay = params_1.defaultLongPressDelay, id: idProp, parent: parentProp, draggable: draggableProp, receptive: receptiveProp, monitoring: monitoringProp, ...props }) => {
    // Coalesce protocol props into capabilities.
    const draggable = draggableProp ?? (dragPayload !== undefined
        || payload !== undefined
        || !!onDrag
        || !!onDragEnd
        || !!onDragEnter
        || !!onDragExit
        || !!onDragOver
        || !!onDragStart
        || !!onDragDrop);
    const receptive = receptiveProp ?? (receiverPayload !== undefined
        || payload !== undefined
        || !!onReceiveDragEnter
        || !!onReceiveDragExit
        || !!onReceiveDragOver
        || !!onReceiveDragDrop);
    const monitoring = monitoringProp ?? (!!onMonitorDragStart
        || !!onMonitorDragEnter
        || !!onMonitorDragOver
        || !!onMonitorDragExit
        || !!onMonitorDragEnd
        || !!onMonitorDragDrop);
    // The unique identifer for this view, initialized below.
    const [id, setId] = react_1.useState('');
    // The underlying View, for measuring.
    const viewRef = react_1.useRef(null);
    // The underlying View node handle, used for subprovider nesting if this is a Drax parent view.
    const nodeHandleRef = react_1.useRef(null);
    // This view's measurements, for reference.
    const measurementsRef = react_1.useRef(undefined);
    // Connect with Drax.
    const { getViewState, getTrackingStatus, registerView, unregisterView, updateViewProtocol, updateViewMeasurements, handleGestureEvent, handleGestureStateChange, rootNodeHandleRef, parent: contextParent, } = useDrax_1.useDrax();
    // Identify Drax parent view (if any) from context or prop override.
    const parent = parentProp ?? contextParent;
    const parentId = parent && parent.id;
    // Identify parent node handle ref.
    const parentNodeHandleRef = parent ? parent.nodeHandleRef : rootNodeHandleRef;
    // Initialize id.
    react_1.useEffect(() => {
        if (idProp) {
            if (id !== idProp) {
                setId(idProp);
            }
        }
        else if (!id) {
            setId(v4_1.default());
        }
    }, [id, idProp]);
    // Register and unregister with Drax context when necessary.
    react_1.useEffect(() => {
        if (id) {
            // Register with Drax context after we have an id.
            registerView({ id, parentId, scrollPositionRef });
            // Unregister when we unmount.
            return () => unregisterView({ id });
        }
        return undefined;
    }, [
        id,
        parentId,
        scrollPositionRef,
        registerView,
        unregisterView,
    ]);
    // Combine hover styles for given internal render props.
    const getCombinedHoverStyle = react_1.useCallback(({ viewState: { dragStatus }, trackingStatus: { receiving: anyReceiving }, hoverPosition, dimensions, }) => {
        // Start with base style, calculated dimensions, and hover base style.
        const hoverStyles = [
            style,
            dimensions,
            hoverStyle,
        ];
        // Apply style style overrides based on state.
        if (dragStatus === types_1.DraxViewDragStatus.Dragging) {
            hoverStyles.push(hoverDraggingStyle);
            if (anyReceiving) {
                hoverStyles.push(hoverDraggingWithReceiverStyle);
            }
            else {
                hoverStyles.push(hoverDraggingWithoutReceiverStyle);
            }
        }
        else if (dragStatus === types_1.DraxViewDragStatus.Released) {
            hoverStyles.push(hoverDragReleasedStyle);
        }
        // Apply hover transform.
        const transform = hoverPosition.getTranslateTransform();
        hoverStyles.push({ transform });
        // Remove any positioning/sizing styles.
        const { margin, marginHorizontal, marginVertical, marginLeft, marginRight, marginTop, marginBottom, marginStart, marginEnd, left, right, top, bottom, flex, flexBasis, flexDirection, flexGrow, flexShrink, ...combinedHoverStyle } = react_native_1.StyleSheet.flatten(hoverStyles);
        return combinedHoverStyle;
    }, [
        style,
        hoverStyle,
        hoverDraggingStyle,
        hoverDraggingWithReceiverStyle,
        hoverDraggingWithoutReceiverStyle,
        hoverDragReleasedStyle,
    ]);
    // Internal render function for hover views, used in protocol by provider.
    const internalRenderHoverView = react_1.useMemo(() => ((draggable && !noHover)
        ? (internalProps) => {
            let content;
            const render = renderHoverContent ?? renderContent;
            if (render) {
                const renderProps = {
                    children,
                    hover: true,
                    viewState: internalProps.viewState,
                    trackingStatus: internalProps.trackingStatus,
                    dimensions: internalProps.dimensions,
                };
                content = render(renderProps);
            }
            else {
                content = children;
            }
            return (react_1.default.createElement(react_native_1.Animated.View, Object.assign({}, props, { key: internalProps.key, style: getCombinedHoverStyle(internalProps) }), content));
        }
        : undefined), [
        draggable,
        noHover,
        renderHoverContent,
        renderContent,
        getCombinedHoverStyle,
        props,
        children,
    ]);
    // Report updates to our protocol callbacks when we have an id and whenever the props change.
    react_1.useEffect(() => {
        if (id) {
            updateViewProtocol({
                id,
                protocol: {
                    onDragStart,
                    onDrag,
                    onDragEnter,
                    onDragOver,
                    onDragExit,
                    onDragEnd,
                    onDragDrop,
                    onSnapbackEnd,
                    onReceiveDragEnter,
                    onReceiveDragOver,
                    onReceiveDragExit,
                    onReceiveDragDrop,
                    onMonitorDragStart,
                    onMonitorDragEnter,
                    onMonitorDragOver,
                    onMonitorDragExit,
                    onMonitorDragEnd,
                    onMonitorDragDrop,
                    animateSnapback,
                    snapbackDelay,
                    snapbackDuration,
                    internalRenderHoverView,
                    draggable,
                    receptive,
                    monitoring,
                    dragPayload: dragPayload ?? payload,
                    receiverPayload: receiverPayload ?? payload,
                },
            });
        }
    }, [
        id,
        updateViewProtocol,
        children,
        onDragStart,
        onDrag,
        onDragEnter,
        onDragOver,
        onDragExit,
        onDragEnd,
        onDragDrop,
        onSnapbackEnd,
        onReceiveDragEnter,
        onReceiveDragOver,
        onReceiveDragExit,
        onReceiveDragDrop,
        onMonitorDragStart,
        onMonitorDragEnter,
        onMonitorDragOver,
        onMonitorDragExit,
        onMonitorDragEnd,
        onMonitorDragDrop,
        animateSnapback,
        snapbackDelay,
        snapbackDuration,
        payload,
        dragPayload,
        receiverPayload,
        draggable,
        receptive,
        monitoring,
        internalRenderHoverView,
    ]);
    // Connect gesture state change handling into Drax context, tied to this id.
    const onHandlerStateChange = react_1.useCallback(({ nativeEvent }) => handleGestureStateChange(id, nativeEvent), [id, handleGestureStateChange]);
    // Create throttled gesture event handler, tied to this id.
    const throttledHandleGestureEvent = react_1.useCallback(lodash_throttle_1.default((event) => {
        // Pass the event up to the Drax context.
        handleGestureEvent(id, event);
    }, 10), [id, handleGestureEvent]);
    // Connect gesture event handling into Drax context, extracting nativeEvent.
    const onGestureEvent = react_1.useCallback((event) => throttledHandleGestureEvent(event.nativeEvent), [throttledHandleGestureEvent]);
    // Build a callback which will report our measurements to Drax context,
    // onMeasure, and an optional measurement handler.
    const buildMeasureCallback = react_1.useCallback((measurementHandler) => ((x, y, width, height) => {
        /*
         * In certain cases (on Android), all of these values can be
         * undefined when the view is not on screen; This should not
         * happen with the measurement functions we're using, but just
         * for the sake of paranoia, we'll check and use undefined
         * for the entire measurements object.
         */
        const measurements = (height === undefined
            ? undefined
            : {
                height,
                x: x,
                y: y,
                width: width,
            });
        measurementsRef.current = measurements;
        updateViewMeasurements({ id, measurements });
        onMeasure?.(measurements);
        measurementHandler?.(measurements);
    }), [id, updateViewMeasurements, onMeasure]);
    // Callback which will report our measurements to Drax context and onMeasure.
    const updateMeasurements = react_1.useMemo(() => buildMeasureCallback(), [buildMeasureCallback]);
    // Measure and report our measurements to Drax context, onMeasure, and an
    // optional measurement handler on demand.
    const measureWithHandler = react_1.useCallback((measurementHandler) => {
        const view = viewRef.current;
        if (view) {
            const nodeHandle = parentNodeHandleRef.current;
            if (nodeHandle) {
                const measureCallback = measurementHandler
                    ? buildMeasureCallback(measurementHandler)
                    : updateMeasurements;
                // console.log('definitely measuring in reference to something');
                view.measureLayout(nodeHandle, measureCallback, () => {
                    // console.log('Failed to measure Drax view in relation to parent nodeHandle');
                });
            }
            else {
                // console.log('No parent nodeHandle to measure Drax view in relation to');
            }
        }
        else {
            // console.log('No view to measure');
        }
    }, [
        parentNodeHandleRef,
        buildMeasureCallback,
        updateMeasurements,
    ]);
    // Measure and send our measurements to Drax context and onMeasure, used when this view finishes layout.
    const onLayout = react_1.useCallback(() => {
        // console.log(`onLayout ${id}`);
        measureWithHandler();
    }, [measureWithHandler]);
    // Establish dimensions/orientation change handler when necessary.
    react_1.useEffect(() => {
        const handler = ( /* { screen: { width, height } }: { screen: ScaledSize } */) => {
            // console.log(`Dimensions changed to ${width}/${height}`);
            setTimeout(measureWithHandler, 100);
        };
        react_native_1.Dimensions.addEventListener('change', handler);
        return () => react_native_1.Dimensions.removeEventListener('change', handler);
    }, [measureWithHandler]);
    // Register and unregister externally when necessary.
    react_1.useEffect(() => {
        if (id && registration) { // Register externally when we have an id and registration is set.
            registration({
                id,
                measure: measureWithHandler,
            });
            return () => registration(undefined); // Unregister when we unmount or registration changes.
        }
        return undefined;
    }, [id, registration, measureWithHandler]);
    // Get the render-related state for rendering.
    const viewState = getViewState(id);
    const trackingStatus = getTrackingStatus();
    // Get full render props for non-hovering view content.
    const getRenderContentProps = react_1.useCallback(() => {
        const measurements = measurementsRef.current;
        const dimensions = measurements && math_1.extractDimensions(measurements);
        return {
            viewState,
            trackingStatus,
            children,
            dimensions,
            hover: false,
        };
    }, [
        viewState,
        trackingStatus,
        children,
    ]);
    // Combined style for current render-related state.
    const combinedStyle = react_1.useMemo(() => {
        const { dragStatus = types_1.DraxViewDragStatus.Inactive, receiveStatus = types_1.DraxViewReceiveStatus.Inactive, } = viewState ?? {};
        const { dragging: anyDragging, receiving: anyReceiving, } = trackingStatus;
        // Start with base style.
        const styles = [style];
        // Apply style overrides for drag state.
        if (dragStatus === types_1.DraxViewDragStatus.Dragging) {
            styles.push(draggingStyle);
            if (anyReceiving) {
                styles.push(draggingWithReceiverStyle);
            }
            else {
                styles.push(draggingWithoutReceiverStyle);
            }
        }
        else if (dragStatus === types_1.DraxViewDragStatus.Released) {
            styles.push(dragReleasedStyle);
        }
        else {
            styles.push(dragInactiveStyle);
            if (anyDragging) {
                styles.push(otherDraggingStyle);
                if (anyReceiving) {
                    styles.push(otherDraggingWithReceiverStyle);
                }
                else {
                    styles.push(otherDraggingWithoutReceiverStyle);
                }
            }
        }
        // Apply style overrides for receiving state.
        if (receiveStatus === types_1.DraxViewReceiveStatus.Receiving) {
            styles.push(receivingStyle);
        }
        else {
            styles.push(receiverInactiveStyle);
        }
        return react_native_1.StyleSheet.flatten(styles);
    }, [
        viewState,
        trackingStatus,
        style,
        dragInactiveStyle,
        draggingStyle,
        draggingWithReceiverStyle,
        draggingWithoutReceiverStyle,
        dragReleasedStyle,
        receivingStyle,
        receiverInactiveStyle,
        otherDraggingStyle,
        otherDraggingWithReceiverStyle,
        otherDraggingWithoutReceiverStyle,
    ]);
    // The rendered React children of this view.
    const content = react_1.useMemo(() => {
        let content;
        if (renderContent) {
            const renderContentProps = getRenderContentProps();
            content = renderContent(renderContentProps);
        }
        else {
            content = children;
        }
        if (isParent) {
            // This is a Drax parent, so wrap children in subprovider.
            content = (react_1.default.createElement(DraxSubprovider_1.DraxSubprovider, { parent: { id, nodeHandleRef } }, content));
        }
        return content;
    }, [
        renderContent,
        getRenderContentProps,
        children,
        isParent,
        id,
        nodeHandleRef,
    ]);
    const setViewRefs = react_1.useCallback((ref) => {
        const view = ref && ref.getNode();
        viewRef.current = view;
        nodeHandleRef.current = view && react_native_1.findNodeHandle(view);
    }, []);
    return (react_1.default.createElement(react_native_gesture_handler_1.LongPressGestureHandler, { maxDist: Number.MAX_SAFE_INTEGER, shouldCancelWhenOutside: false, minDurationMs: longPressDelay, onHandlerStateChange: onHandlerStateChange, onGestureEvent: onGestureEvent /* Workaround incorrect typings. */, enabled: draggable },
        react_1.default.createElement(react_native_1.Animated.View, Object.assign({}, props, { style: combinedStyle, ref: setViewRefs, onLayout: onLayout, collapsable: false }), content)));
};
