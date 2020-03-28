"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PacketType;
(function (PacketType) {
    PacketType[PacketType["FREE_START"] = 0] = "FREE_START";
    PacketType[PacketType["FREE_DRAW"] = 1] = "FREE_DRAW";
    PacketType[PacketType["FREE_END"] = 2] = "FREE_END";
    PacketType[PacketType["CLEAR"] = 3] = "CLEAR";
    PacketType[PacketType["FREE_DOT"] = 4] = "FREE_DOT";
    PacketType[PacketType["RESIZE"] = 5] = "RESIZE";
    PacketType[PacketType["NEWMAXSIZE"] = 6] = "NEWMAXSIZE";
    PacketType[PacketType["STRAIGHT_PREDICT"] = 7] = "STRAIGHT_PREDICT";
    PacketType[PacketType["STRAIGHT_DRAW"] = 8] = "STRAIGHT_DRAW";
    PacketType[PacketType["UNDO"] = 9] = "UNDO";
    PacketType[PacketType["REDO"] = 10] = "REDO";
})(PacketType = exports.PacketType || (exports.PacketType = {}));
var Color;
(function (Color) {
    Color["RED"] = "#f44336";
    Color["BLUE"] = "#2196f3";
    Color["GREEN"] = "#4caf50";
    Color["YELLOW"] = "#ffeb3b";
    Color["BLACK"] = "#212121";
    Color["INTERNAL"] = "#673ab7";
})(Color = exports.Color || (exports.Color = {}));
var Mode;
(function (Mode) {
    Mode[Mode["FREE"] = 0] = "FREE";
    Mode[Mode["STRAIGHT"] = 1] = "STRAIGHT";
    Mode[Mode["POINT"] = 2] = "POINT";
    Mode[Mode["SQUARE"] = 3] = "SQUARE";
    Mode[Mode["CIRCLE"] = 4] = "CIRCLE";
    Mode[Mode["DOT"] = 5] = "DOT";
})(Mode = exports.Mode || (exports.Mode = {}));
//# sourceMappingURL=protocol.js.map