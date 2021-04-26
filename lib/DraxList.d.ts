import React, { PropsWithChildren, ReactElement } from "react";
import { FlatList } from "react-native";
import { DraxListProps } from "./types";
declare type DraxListComponentProps<T extends any> = PropsWithChildren<DraxListProps<T>>;
declare type FlatListRefType = React.Ref<FlatList<any>>;
export declare const DraxList: <T extends unknown>(p: DraxListProps<T> & {
    children?: React.ReactNode;
} & {
    ref?: ((instance: FlatList<any> | null) => void) | React.RefObject<FlatList<any>> | null | undefined;
}) => React.ReactElement | null;
export {};
