export type Phase = "3P3W" | "3P4W";
export type DeviceInfo = { id: number; name: string; phase: Phase };

export const DEVICES: DeviceInfo[] = [
    { id: 11, name: "Meter #11", phase: "3P3W" },
    { id: 12, name: "Meter #12", phase: "3P3W" },
    { id: 13, name: "Meter #13", phase: "3P3W" },
    { id: 14, name: "Meter #14", phase: "3P4W" },
    { id: 15, name: "Meter #15", phase: "3P4W" },
];
