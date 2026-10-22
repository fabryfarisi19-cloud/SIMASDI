
"use client";

import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Props = {
  latitude: number;
  longitude: number;
};

const LATITUDE_KANTOR = -6.205060;
const LONGITUDE_KANTOR = 106.787456;
const RADIUS_KANTOR = 100;

export default function AbsensiMap({
  latitude,
  longitude,
}: Props) {
  const officePosition: [number, number] = [
    LATITUDE_KANTOR,
    LONGITUDE_KANTOR,
  ];

  const devicePosition: [number, number] = [
    latitude,
    longitude,
  ];

  return (
   <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 [&_.leaflet-control-attribution]:text-[9px] [&_.leaflet-control-attribution]:opacity-70">
      <MapContainer
        {...({
          center: officePosition,
          zoom: 17,
          scrollWheelZoom: true,
          style: { height: "400px", width: "100%" },
        } as any)}
      >
  <TileLayer
  {...({
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  } as any)}
/>

        {/* Radius kantor 100 meter */}
        <Circle
          {...({
            center: officePosition,
            radius: RADIUS_KANTOR,
          } as any)}
        />

        {/* Titik kantor */}
        <CircleMarker
          {...({
            center: officePosition,
            radius: 8,
          } as any)}
        >
          <Popup>
            <strong>Bapas Kelas I Jakarta Barat</strong>
            <br />
            Titik lokasi kantor
          </Popup>
        </CircleMarker>

        {/* Titik perangkat */}
        <CircleMarker
          {...({
            center: devicePosition,
            radius: 8,
          } as any)}
        >
          <Popup>
            <strong>Lokasi Perangkat</strong>
            <br />
            Posisi GPS perangkat saat ini
          </Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  );
}
