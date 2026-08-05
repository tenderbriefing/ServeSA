/** South Africa geographic bounds used for case location validation */
export declare const SA_BOUNDS: {
    readonly minLat: -35;
    readonly maxLat: -22;
    readonly minLng: 16;
    readonly maxLng: 33;
};
export declare function isWithinSouthAfrica(lat: number, lng: number): boolean;
export declare function assertSouthAfricaCoords(lat: number, lng: number): void;
