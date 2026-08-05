"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SA_BOUNDS = void 0;
exports.isWithinSouthAfrica = isWithinSouthAfrica;
exports.assertSouthAfricaCoords = assertSouthAfricaCoords;
/** South Africa geographic bounds used for case location validation */
exports.SA_BOUNDS = {
    minLat: -35,
    maxLat: -22,
    minLng: 16,
    maxLng: 33,
};
function isWithinSouthAfrica(lat, lng) {
    if (lat === 0 && lng === 0)
        return false;
    return (lat >= exports.SA_BOUNDS.minLat &&
        lat <= exports.SA_BOUNDS.maxLat &&
        lng >= exports.SA_BOUNDS.minLng &&
        lng <= exports.SA_BOUNDS.maxLng);
}
function assertSouthAfricaCoords(lat, lng) {
    if (!isWithinSouthAfrica(lat, lng)) {
        throw new Error('Coordinates must be within South Africa');
    }
}
