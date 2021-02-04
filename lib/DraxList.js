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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DraxList = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const DraxView_1 = require("./DraxView");
const DraxSubprovider_1 = require("./DraxSubprovider");
const hooks_1 = require("./hooks");
const types_1 = require("./types");
const params_1 = require("./params");
const defaultStyles = react_native_1.StyleSheet.create({
    draggingStyle: { opacity: 0 },
    dragReleasedStyle: { opacity: 0.5 },
});
exports.DraxList = ({ data, style, wrapperStyles, itemStyles, renderItemContent, renderItemHoverContent, onItemReorder, id: idProp, reorderable: reorderableProp, onDragPositionChanged, onDragStart, onDragEnd, ...props }) => {
    // Copy the value of the horizontal property for internal use.
    const { horizontal = false } = props;
    // Get the item count for internal use.
    const itemCount = data?.length ?? 0;
    // Set a sensible default for reorderable prop.
    const reorderable = reorderableProp ?? (onItemReorder !== undefined);
    // The unique identifer for this list's Drax view, initialized below.
    const id = hooks_1.useDraxId(idProp);
    // FlatList, used for scrolling.
    const flatListRef = react_1.useRef(null);
    // FlatList node handle, used for measuring children.
    const nodeHandleRef = react_1.useRef(null);
    // Container view measurements, for scrolling by percentage.
    const containerMeasurementsRef = react_1.useRef(undefined);
    // Content size, for scrolling by percentage.
    const contentSizeRef = react_1.useRef(undefined);
    // Scroll position, for Drax bounds checking and auto-scrolling.
    const scrollPositionRef = react_1.useRef({ x: 0, y: 0 });
    // Original index of the currently dragged list item, if any.
    const draggedItemRef = react_1.useRef(undefined);
    // Auto-scrolling state.
    const scrollStateRef = react_1.useRef(types_1.AutoScrollDirection.None);
    // Auto-scrolling interval.
    const scrollIntervalRef = react_1.useRef(undefined);
    // List item measurements, for determining shift.
    const itemMeasurementsRef = react_1.useRef([]);
    // Drax view registrations, for remeasuring after reorder.
    const registrationsRef = react_1.useRef([]);
    // Shift offsets.
    const shiftsRef = react_1.useRef([]);
    // Maintain cache of reordered list indexes until data updates.
    const [originalIndexes, setOriginalIndexes] = react_1.useState([]);
    // Maintain the toPayload the item is currently dragged to
    const curToPayload = react_1.useRef(undefined);
    // Adjust measurements and shift value arrays as item count changes.
    react_1.useEffect(() => {
        const itemMeasurements = itemMeasurementsRef.current;
        const registrations = registrationsRef.current;
        const shifts = shiftsRef.current;
        if (itemMeasurements.length > itemCount) {
            itemMeasurements.splice(itemCount - itemMeasurements.length);
            registrations.splice(itemCount - registrations.length);
            shifts.splice(itemCount - shifts.length);
        }
        else {
            while (itemMeasurements.length < itemCount) {
                itemMeasurements.push(undefined);
                registrations.push(undefined);
                shifts.push({
                    targetValue: 0,
                    animatedValue: new react_native_1.Animated.Value(0),
                });
            }
        }
    }, [itemCount]);
    // Clear reorders when data changes.
    react_1.useLayoutEffect(() => {
        // console.log('clear reorders');
        setOriginalIndexes(data ? [...Array(data.length).keys()] : []);
    }, [data]);
    // Apply the reorder cache to the data.
    const reorderedData = react_1.useMemo(() => {
        // console.log('refresh sorted data');
        if (!id || data === null) {
            return null;
        }
        if (data.length !== originalIndexes.length) {
            return data;
        }
        return originalIndexes.map((index) => data[index]);
    }, [id, data, originalIndexes]);
    // Get shift transform for list item at index.
    const getShiftTransform = react_1.useCallback((index) => {
        const shift = shiftsRef.current[index]?.animatedValue ?? 0;
        return horizontal
            ? [{ translateX: shift }]
            : [{ translateY: shift }];
    }, [horizontal]);
    // Set the currently dragged list item.
    const setDraggedItem = react_1.useCallback((originalIndex) => {
        draggedItemRef.current = originalIndex;
    }, []);
    // Clear the currently dragged list item.
    const resetDraggedItem = react_1.useCallback(() => {
        draggedItemRef.current = undefined;
    }, []);
    // Drax view renderItem wrapper.
    const renderItem = react_1.useCallback((info) => {
        const { index } = info;
        const originalIndex = originalIndexes[index];
        const { style, draggingStyle = defaultStyles.draggingStyle, dragReleasedStyle = defaultStyles.dragReleasedStyle, ...otherStyleProps } = itemStyles ?? {};
        return (react_1.default.createElement(DraxView_1.DraxView, Object.assign({ style: [style, { transform: getShiftTransform(originalIndex) }], draggingStyle: draggingStyle, dragReleasedStyle: dragReleasedStyle }, otherStyleProps, { payload: { index, originalIndex }, onDragStart: (evt) => {
                if (onDragStart)
                    onDragStart(evt);
                setDraggedItem(originalIndex);
            }, onDragEnd: (evt) => {
                if (onDragEnd)
                    onDragEnd(evt);
                resetDraggedItem();
            }, onDragDrop: resetDraggedItem, onMeasure: (measurements) => {
                // console.log(`measuring [${index}, ${originalIndex}]: (${measurements?.x}, ${measurements?.y})`);
                itemMeasurementsRef.current[originalIndex] = measurements;
            }, registration: (registration) => {
                if (registration) {
                    // console.log(`registering [${index}, ${originalIndex}], ${registration.id}`);
                    registrationsRef.current[originalIndex] = registration;
                    registration.measure();
                }
            }, renderContent: (props) => renderItemContent(info, props), renderHoverContent: renderItemHoverContent && ((props) => renderItemHoverContent(info, props)), longPressDelay: params_1.defaultListItemLongPressDelay })));
    }, [
        originalIndexes,
        getShiftTransform,
        setDraggedItem,
        resetDraggedItem,
        itemStyles,
        renderItemContent,
        renderItemHoverContent,
        onDragStart,
        onDragEnd,
    ]);
    // Track the size of the container view.
    const onMeasureContainer = react_1.useCallback((measurements) => {
        containerMeasurementsRef.current = measurements;
    }, []);
    // Track the size of the content.
    const onContentSizeChange = react_1.useCallback((width, height) => {
        contentSizeRef.current = { x: width, y: height };
    }, []);
    // Set FlatList and node handle refs.
    const setFlatListRefs = react_1.useCallback((ref) => {
        flatListRef.current = ref;
        nodeHandleRef.current = ref && react_native_1.findNodeHandle(ref);
    }, []);
    // Update tracked scroll position when list is scrolled.
    const onScroll = react_1.useCallback(({ nativeEvent: { contentOffset } }) => {
        scrollPositionRef.current = { ...contentOffset };
    }, []);
    // Handle auto-scrolling on interval.
    const doScroll = react_1.useCallback(() => {
        const flatList = flatListRef.current;
        const containerMeasurements = containerMeasurementsRef.current;
        const contentSize = contentSizeRef.current;
        if (!flatList || !containerMeasurements || !contentSize) {
            return;
        }
        let containerLength;
        let contentLength;
        let prevOffset;
        if (horizontal) {
            containerLength = containerMeasurements.width;
            contentLength = contentSize.x;
            prevOffset = scrollPositionRef.current.x;
        }
        else {
            containerLength = containerMeasurements.height;
            contentLength = contentSize.y;
            prevOffset = scrollPositionRef.current.y;
        }
        const jumpLength = containerLength * 0.2;
        let offset;
        if (scrollStateRef.current === types_1.AutoScrollDirection.Forward) {
            const maxOffset = contentLength - containerLength;
            if (prevOffset < maxOffset) {
                offset = Math.min(prevOffset + jumpLength, maxOffset);
            }
        }
        else if (scrollStateRef.current === types_1.AutoScrollDirection.Back) {
            if (prevOffset > 0) {
                offset = Math.max(prevOffset - jumpLength, 0);
            }
        }
        if (offset !== undefined) {
            flatList.scrollToOffset({ offset });
            flatList.flashScrollIndicators();
        }
    }, [horizontal]);
    // Start the auto-scrolling interval.
    const startScroll = react_1.useCallback(() => {
        if (scrollIntervalRef.current) {
            return;
        }
        doScroll();
        scrollIntervalRef.current = setInterval(doScroll, 250);
    }, [doScroll]);
    // Stop the auto-scrolling interval.
    const stopScroll = react_1.useCallback(() => {
        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = undefined;
        }
    }, []);
    // If startScroll changes, refresh our interval.
    react_1.useEffect(() => {
        if (scrollIntervalRef.current) {
            stopScroll();
            startScroll();
        }
    }, [stopScroll, startScroll]);
    // Reset all shift values.
    const resetShifts = react_1.useCallback(() => {
        shiftsRef.current.forEach((shift) => {
            shift.targetValue = 0;
            shift.animatedValue.setValue(0);
        });
    }, []);
    // Update shift values in response to a drag.
    const updateShifts = react_1.useCallback(({ index: fromIndex, originalIndex: fromOriginalIndex }, { index: toIndex }) => {
        const { width = 50, height = 50 } = itemMeasurementsRef.current[fromOriginalIndex] ?? {};
        const offset = horizontal ? width : height;
        originalIndexes.forEach((originalIndex, index) => {
            const shift = shiftsRef.current[originalIndex];
            let newTargetValue = 0;
            if (index > fromIndex && index <= toIndex) {
                newTargetValue = -offset;
            }
            else if (index < fromIndex && index >= toIndex) {
                newTargetValue = offset;
            }
            if (shift.targetValue !== newTargetValue) {
                shift.targetValue = newTargetValue;
                react_native_1.Animated.timing(shift.animatedValue, {
                    duration: 200,
                    toValue: newTargetValue,
                    useNativeDriver: true,
                }).start();
            }
        });
    }, [originalIndexes, horizontal]);
    // Calculate absolute position of list item for snapback.
    const calculateSnapbackTarget = react_1.useCallback(({ index: fromIndex, originalIndex: fromOriginalIndex }, { index: toIndex, originalIndex: toOriginalIndex }) => {
        const containerMeasurements = containerMeasurementsRef.current;
        const itemMeasurements = itemMeasurementsRef.current;
        if (containerMeasurements) {
            let targetPos;
            if (fromIndex < toIndex) {
                // Target pos(toIndex + 1) - pos(fromIndex)
                const nextIndex = toIndex + 1;
                let nextPos;
                if (nextIndex < itemCount) {
                    // toIndex + 1 is in the list. We can measure the position of the next item.
                    const nextMeasurements = itemMeasurements[originalIndexes[nextIndex]];
                    if (nextMeasurements) {
                        nextPos = { x: nextMeasurements.x, y: nextMeasurements.y };
                    }
                }
                else {
                    // toIndex is the last item of the list. We can use the list content size.
                    const contentSize = contentSizeRef.current;
                    if (contentSize) {
                        nextPos = horizontal
                            ? { x: contentSize.x, y: 0 }
                            : { x: 0, y: contentSize.y };
                    }
                }
                const fromMeasurements = itemMeasurements[fromOriginalIndex];
                if (nextPos && fromMeasurements) {
                    targetPos = horizontal
                        ? { x: nextPos.x - fromMeasurements.width, y: nextPos.y }
                        : { x: nextPos.x, y: nextPos.y - fromMeasurements.height };
                }
            }
            else {
                // Target pos(toIndex)
                const toMeasurements = itemMeasurements[toOriginalIndex];
                if (toMeasurements) {
                    targetPos = { x: toMeasurements.x, y: toMeasurements.y };
                }
            }
            if (targetPos) {
                const scrollPosition = scrollPositionRef.current;
                return {
                    x: containerMeasurements.x - scrollPosition.x + targetPos.x,
                    y: containerMeasurements.y - scrollPosition.y + targetPos.y,
                };
            }
        }
        return types_1.DraxSnapbackTargetPreset.None;
    }, [horizontal, itemCount, originalIndexes]);
    // Stop scrolling, and potentially update shifts and reorder data.
    const handleInternalDragEnd = react_1.useCallback((dragged, receiver) => {
        // Always stop auto-scroll on drag end.
        scrollStateRef.current = types_1.AutoScrollDirection.None;
        stopScroll();
        // If the list is reorderable, handle shifts and reordering.
        if (reorderable) {
            // Determine list indexes of dragged/received items, if any.
            const fromPayload = dragged && (dragged.parentId === id)
                ? dragged.payload
                : undefined;
            const toPayload = curToPayload.current || ((fromPayload !== undefined && receiver && receiver.parentId === id) ? receiver.payload : undefined);
            if (fromPayload !== undefined) {
                // If dragged item was ours, reset shifts.
                resetShifts();
                if (toPayload !== undefined) {
                    // If dragged item and received item were ours, reorder data.
                    // console.log(`moving ${fromPayload.index} -> ${toPayload.index}`);
                    const snapbackTarget = calculateSnapbackTarget(fromPayload, toPayload);
                    const { index: fromIndex, originalIndex: fromOriginalIndex } = fromPayload;
                    const { index: toIndex, originalIndex: toOriginalIndex } = toPayload;
                    if (data) {
                        const newOriginalIndexes = originalIndexes.slice();
                        newOriginalIndexes.splice(toIndex, 0, newOriginalIndexes.splice(fromIndex, 1)[0]);
                        setOriginalIndexes(newOriginalIndexes);
                        onItemReorder?.({
                            fromIndex,
                            toIndex,
                            fromItem: data[fromOriginalIndex],
                            toItem: data[toOriginalIndex],
                        });
                    }
                    return snapbackTarget;
                }
            }
        }
        return undefined;
    }, [
        id,
        data,
        stopScroll,
        reorderable,
        resetShifts,
        calculateSnapbackTarget,
        originalIndexes,
        onItemReorder,
    ]);
    // Monitor drags to react with item shifts and auto-scrolling.
    const onMonitorDragOver = react_1.useCallback(({ dragged, receiver, monitorOffsetRatio, dragAbsolutePosition }) => {
        // Only update things if we are dragging within the list itself, otherwise leave things alone
        const dragIsWithinList = contentSizeRef.current && dragAbsolutePosition.y < contentSizeRef.current.y && dragAbsolutePosition.y > 0 && dragAbsolutePosition.x < contentSizeRef.current.x && dragAbsolutePosition.x > 0;
        // First, check if we need to shift items.
        if (reorderable && dragged.parentId === id && dragIsWithinList) {
            // One of our list items is being dragged.
            const fromPayload = dragged.payload;
            // Find its current index in the list for the purpose of shifting.
            const toPayload = receiver?.parentId === id
                ? receiver.payload
                : fromPayload;
            if (curToPayload.current !== undefined
                && toPayload.index !== curToPayload.current.index
                && onDragPositionChanged) {
                onDragPositionChanged(toPayload.index);
            }
            curToPayload.current = toPayload;
            updateShifts(fromPayload, toPayload);
        }
        // Next, see if we need to auto-scroll.
        const ratio = horizontal ? monitorOffsetRatio.x : monitorOffsetRatio.y;
        if (ratio > 0.1 && ratio < 0.9) {
            scrollStateRef.current = types_1.AutoScrollDirection.None;
            stopScroll();
        }
        else {
            if (ratio >= 0.9) {
                scrollStateRef.current = types_1.AutoScrollDirection.Forward;
            }
            else if (ratio <= 0.1) {
                scrollStateRef.current = types_1.AutoScrollDirection.Back;
            }
            startScroll();
        }
    }, [
        id,
        reorderable,
        updateShifts,
        horizontal,
        stopScroll,
        startScroll,
        onDragPositionChanged,
    ]);
    // Monitor drag exits to stop scrolling and update shifts.
    const onMonitorDragExit = react_1.useCallback(({ dragged }) => handleInternalDragEnd(dragged), [handleInternalDragEnd]);
    /*
     * Monitor drag ends to stop scrolling, update shifts, and possibly reorder.
     * This addresses the Android case where if we drag a list item and auto-scroll
     * too far, the drag gets cancelled.
     */
    const onMonitorDragEnd = react_1.useCallback(({ dragged, receiver }) => handleInternalDragEnd(dragged, receiver), [handleInternalDragEnd]);
    // Monitor drag drops to stop scrolling, update shifts, and possibly reorder.
    const onMonitorDragDrop = react_1.useCallback(({ dragged, receiver }) => handleInternalDragEnd(dragged, receiver), [handleInternalDragEnd]);
    return id ? (react_1.default.createElement(DraxView_1.DraxView, { id: id, style: wrapperStyles, scrollPositionRef: scrollPositionRef, onMeasure: onMeasureContainer, onMonitorDragOver: onMonitorDragOver, onMonitorDragExit: onMonitorDragExit, onMonitorDragEnd: onMonitorDragEnd, onMonitorDragDrop: onMonitorDragDrop },
        react_1.default.createElement(DraxSubprovider_1.DraxSubprovider, { parent: { id, nodeHandleRef } },
            react_1.default.createElement(react_native_1.FlatList, Object.assign({}, props, { style: style, ref: setFlatListRefs, renderItem: renderItem, onScroll: onScroll, onContentSizeChange: onContentSizeChange, data: reorderedData }))))) : null;
};
