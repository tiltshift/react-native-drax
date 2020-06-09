"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDrax = void 0;
const react_1 = require("react");
const DraxContext_1 = require("./DraxContext");
exports.useDrax = () => {
    const drax = react_1.useContext(DraxContext_1.DraxContext);
    if (!drax) {
        throw Error('No DraxProvider found');
    }
    return drax;
};
