import React, { PropsWithChildren, ReactElement } from 'react';
import { DraxListProps } from './types';
export declare const DraxList: <T extends unknown>({ data, style, wrapperStyles, itemStyles, renderItemContent, renderItemHoverContent, onItemReorder, id: idProp, reorderable: reorderableProp, onDragPositionChanged, onDragStart, onDragEnd, ...props }: React.PropsWithChildren<DraxListProps<T>>) => ReactElement | null;
