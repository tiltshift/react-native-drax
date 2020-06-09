"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDraxId = void 0;
const react_1 = require("react");
const v4_1 = __importDefault(require("uuid/v4"));
exports.useDraxId = (idProp) => {
    // The unique identifer for this view, initialized below.
    const [id, setId] = react_1.useState('');
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
    return id;
};
