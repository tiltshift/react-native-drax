"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractDimensions = exports.extractPosition = exports.getRelativePosition = exports.isPointInside = exports.clipMeasurements = void 0;
exports.clipMeasurements = (vm, cvm) => {
    let { width, height, x: x0, y: y0, } = vm;
    let x1 = x0 + width;
    let y1 = y0 + width;
    const { width: cwidth, height: cheight, x: cx0, y: cy0, } = cvm;
    const cx1 = cx0 + cwidth;
    const cy1 = cy0 + cheight;
    if (x0 >= cx1 || x1 <= cx0 || y0 >= cy1 || y1 <= cy0) {
        return {
            x: -1,
            y: -1,
            width: 0,
            height: 0,
        };
    }
    if (x0 < cx0) {
        x0 = cx0;
        width -= cx0 - x0;
    }
    if (x1 > cx1) {
        x1 = cx1;
        width -= x1 - cx1;
    }
    if (y0 < cy0) {
        y0 = cy0;
        height -= cy0 - y0;
    }
    if (y1 > cy1) {
        y1 = cy1;
        height -= y1 - cy1;
    }
    return {
        width,
        height,
        x: x0,
        y: y0,
    };
};
exports.isPointInside = ({ x, y }, { width, height, x: x0, y: y0, }) => (x >= x0 && y >= y0 && x < x0 + width && y < y0 + height);
exports.getRelativePosition = ({ x, y }, { width, height, x: x0, y: y0, }) => {
    const rx = x - x0;
    const ry = y - y0;
    return {
        relativePosition: { x: rx, y: ry },
        relativePositionRatio: { x: rx / width, y: ry / height },
    };
};
exports.extractPosition = ({ x, y }) => ({ x, y });
exports.extractDimensions = ({ width, height }) => ({ width, height });
