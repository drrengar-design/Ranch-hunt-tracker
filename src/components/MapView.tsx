import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import {
  ImageOverlay,
  MapContainer,
  Marker,
  Popup,
  ZoomControl,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import {
  MAP_BOUNDS,
  MAP_HEIGHT,
  MAP_IMAGE_URL,
  MAP_WIDTH,
  fromLatLng,
  toLatLng,
} from '../mapConfig';
import { LAGUNA, WELL } from '../suggestions';
import type { HuntMarker, MarkerKind } from '../types';
import { formatWhen, useStore } from '../store';
import { Modal } from './Modal';

function pinIcon(
  kind: string,
  label: string,
  extra = '',
): L.DivIcon {
  const letter =
    kind === 'blind' ? 'B' : kind === 'feeder' ? 'F' : kind === 'well' ? 'W' : 'L';
  return L.divIcon({
    className: `pin ${kind} ${extra}`,
    html: `<div class="pin-inner"><div class="pin-mark"><span>${letter}</span></div><div class="pin-label">${escapeHtml(label)}</div></div>`,
    iconSize: [88, 52],
    iconAnchor: [44, 36],
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function FitOnce() {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    map.fitBounds(MAP_BOUNDS, { padding: [12, 12] });
  }, [map]);
  return null;
}

function InvalidateOnShow({ show }: { show: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!show) return;
    const t = window.setTimeout(() => map.invalidateSize(), 50);
    return () => window.clearTimeout(t);
  }, [map, show]);
  return null;
}

function PlaceClick({
  placing,
  onPlace,
}: {
  placing: MarkerKind | null;
  onPlace: (x: number, y: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (!placing) return;
      const { x, y } = fromLatLng(e.latlng.lat, e.latlng.lng);
      onPlace(x, y);
    },
  });
  return null;
}

function MarkerEditor({
  marker,
  onClose,
}: {
  marker: HuntMarker;
  onClose: () => void;
}) {
  const { upsertMarker, deleteMarker } = useStore();
  const [name, setName] = useState(marker.name);
  const [notes, setNotes] = useState(marker.notes);
  const [kind, setKind] = useState<MarkerKind>(marker.kind);

  return (
    <Modal title="Edit marker" onClose={onClose}>
      <div className="field">
        <label htmlFor="mk-name">Name</label>
        <input
          id="mk-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>
      <div className="field">
        <label htmlFor="mk-kind">Type</label>
        <select
          id="mk-kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as MarkerKind)}
        >
          <option value="blind">Blind</option>
          <option value="feeder">Feeder</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="mk-notes">Notes</label>
        <textarea
          id="mk-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="row">
        <button
          className="btn primary"
          type="button"
          onClick={() => {
            upsertMarker({ ...marker, name: name.trim() || marker.name, notes, kind });
            onClose();
          }}
        >
          Save
        </button>
        <button
          className="btn danger"
          type="button"
          onClick={() => {
            if (confirm(`Delete ${marker.name}?`)) {
              deleteMarker(marker.id);
              onClose();
            }
          }}
        >
          Delete
        </button>
        <button className="btn ghost" type="button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}

function CheckInForm({
  marker,
  onClose,
}: {
  marker: HuntMarker;
  onClose: () => void;
}) {
  const { checkIn, data } = useStore();
  const [name, setName] = useState(data.hunterRoster[0] ?? '');

  return (
    <Modal title={`Check in · ${marker.name}`} onClose={onClose}>
      <div className="field">
        <label htmlFor="hunter">Hunter</label>
        <input
          id="hunter"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          autoFocus
        />
      </div>
      {data.hunterRoster.length > 0 && (
        <div className="chips" style={{ marginBottom: 12 }}>
          {data.hunterRoster.map((h) => (
            <button
              key={h}
              type="button"
              className={`chip${h === name ? ' active' : ''}`}
              onClick={() => setName(h)}
            >
              {h}
            </button>
          ))}
        </div>
      )}
      <div className="row">
        <button
          className="btn primary"
          type="button"
          disabled={!name.trim()}
          onClick={() => {
            checkIn(marker.id, name);
            onClose();
          }}
        >
          Check in
        </button>
        <button className="btn ghost" type="button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}

export function HarvestForm({
  presetMarkerId,
  onClose,
}: {
  presetMarkerId?: string;
  onClose: () => void;
}) {
  const { data, addHarvest, blinds } = useStore();
  const [hunterName, setHunterName] = useState(data.hunterRoster[0] ?? '');
  const [species, setSpecies] = useState('White-tailed deer');
  const [sex, setSex] = useState<'buck' | 'doe' | 'boar' | 'sow' | 'unknown'>(
    'unknown',
  );
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [markerId, setMarkerId] = useState(presetMarkerId ?? '');
  const [notes, setNotes] = useState('');

  return (
    <Modal title="Log harvest" onClose={onClose}>
      <div className="field">
        <label htmlFor="hv-hunter">Hunter</label>
        <input
          id="hv-hunter"
          value={hunterName}
          onChange={(e) => setHunterName(e.target.value)}
          autoFocus
        />
      </div>
      <div className="field">
        <label htmlFor="hv-species">Species</label>
        <select
          id="hv-species"
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
        >
          {[
            'White-tailed deer',
            'Feral hog',
            'Rio Grande turkey',
            'Mourning dove',
            'Quail',
            'Javelina',
            'Coyote',
            'Bobcat',
            'Other',
          ].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="hv-sex">Sex</label>
        <select
          id="hv-sex"
          value={sex}
          onChange={(e) => setSex(e.target.value as typeof sex)}
        >
          <option value="unknown">Unknown</option>
          <option value="buck">Buck</option>
          <option value="doe">Doe</option>
          <option value="boar">Boar</option>
          <option value="sow">Sow</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="hv-date">Date</label>
        <input
          id="hv-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="hv-loc">Location</label>
        <select
          id="hv-loc"
          value={markerId}
          onChange={(e) => setMarkerId(e.target.value)}
        >
          <option value="">Field / other</option>
          <option value="laguna">Laguna</option>
          {blinds.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="hv-notes">Notes</label>
        <textarea
          id="hv-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="row">
        <button
          className="btn primary"
          type="button"
          disabled={!hunterName.trim()}
          onClick={() => {
            addHarvest({
              seasonId: data.activeSeasonId,
              hunterName,
              species,
              sex,
              date,
              markerId: markerId || undefined,
              notes,
            });
            onClose();
          }}
        >
          Save harvest
        </button>
        <button className="btn ghost" type="button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}

function HuntMarkerView({
  marker,
  admin,
  occupied,
  occupantName,
  occupantAt,
  onEdit,
  onCheckIn,
  onCheckOut,
  onHarvest,
}: {
  marker: HuntMarker;
  admin: boolean;
  occupied: boolean;
  occupantName?: string;
  occupantAt?: string;
  onEdit: () => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onHarvest: () => void;
}) {
  const { moveMarker } = useStore();
  const icon = useMemo(
    () => pinIcon(marker.kind, marker.name, occupied ? 'occupied' : ''),
    [marker.kind, marker.name, occupied],
  );

  return (
    <Marker
      position={toLatLng(marker.x, marker.y)}
      icon={icon}
      draggable={admin}
      eventHandlers={{
        dragend: (e) => {
          const ll = (e.target as L.Marker).getLatLng();
          const { x, y } = fromLatLng(ll.lat, ll.lng);
          moveMarker(marker.id, x, y);
        },
      }}
    >
      <Popup>
        <div className="popup-card">
          <h3>{marker.name}</h3>
          <p>
            {marker.kind === 'blind' ? 'Blind' : 'Feeder'}
            {occupied && occupantName
              ? ` · Occupied by ${occupantName}${occupantAt ? ` (${formatWhen(occupantAt)})` : ''}`
              : marker.kind === 'blind'
                ? ' · Open'
                : ''}
          </p>
          {marker.notes ? <p>{marker.notes}</p> : null}
          <div className="popup-actions">
            {admin ? (
              <button className="btn small primary" type="button" onClick={onEdit}>
                Edit / rename
              </button>
            ) : (
              <>
                {marker.kind === 'blind' && !occupied && (
                  <button className="btn small primary" type="button" onClick={onCheckIn}>
                    Check in
                  </button>
                )}
                {marker.kind === 'blind' && occupied && (
                  <button className="btn small" type="button" onClick={onCheckOut}>
                    Check out
                  </button>
                )}
                <button className="btn small" type="button" onClick={onHarvest}>
                  Log harvest
                </button>
              </>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export function MapView({ show, admin }: { show: boolean; admin: boolean }) {
  const { data, occupantOf, addMarker, checkOut } = useStore();
  const [placing, setPlacing] = useState<MarkerKind | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [checkInId, setCheckInId] = useState<string | null>(null);
  const [harvestId, setHarvestId] = useState<string | null>(null);
  const [legendOpen, setLegendOpen] = useState(true);

  useEffect(() => {
    if (!admin) setPlacing(null);
  }, [admin]);

  const editing = data.markers.find((m) => m.id === editId);
  const checking = data.markers.find((m) => m.id === checkInId);

  const wellIcon = useMemo(() => pinIcon('landmark well', WELL.name), []);
  const lagunaIcon = useMemo(() => pinIcon('landmark laguna', LAGUNA.name), []);

  return (
    <>
      <MapContainer
        crs={L.CRS.Simple}
        center={[MAP_HEIGHT / 2, MAP_WIDTH / 2]}
        zoom={-2}
        minZoom={-3}
        maxZoom={2}
        zoomSnap={0.25}
        zoomDelta={0.5}
        maxBounds={MAP_BOUNDS}
        maxBoundsViscosity={0.8}
        attributionControl={false}
        zoomControl={false}
        style={{ width: '100%', height: '100%', background: '#10140d' }}
      >
        <ImageOverlay url={MAP_IMAGE_URL} bounds={MAP_BOUNDS} />
        <ZoomControl position="bottomright" />
        <FitOnce />
        <InvalidateOnShow show={show} />
        <PlaceClick
          placing={placing}
          onPlace={(x, y) => {
            if (!placing) return;
            const created = addMarker(placing, x, y);
            setPlacing(null);
            setEditId(created.id);
          }}
        />

        <Marker position={toLatLng(WELL.x, WELL.y)} icon={wellIcon}>
          <Popup>
            <div className="popup-card">
              <h3>{WELL.name}</h3>
              <p>{WELL.notes}</p>
            </div>
          </Popup>
        </Marker>
        <Marker position={toLatLng(LAGUNA.x, LAGUNA.y)} icon={lagunaIcon}>
          <Popup>
            <div className="popup-card">
              <h3>{LAGUNA.name}</h3>
              <p>{LAGUNA.notes}</p>
            </div>
          </Popup>
        </Marker>

        {data.markers.map((m) => {
          const occ = occupantOf(m.id);
          return (
            <HuntMarkerView
              key={m.id}
              marker={m}
              admin={admin}
              occupied={Boolean(occ)}
              occupantName={occ?.hunterName}
              occupantAt={occ?.at}
              onEdit={() => setEditId(m.id)}
              onCheckIn={() => setCheckInId(m.id)}
              onCheckOut={() => checkOut(m.id)}
              onHarvest={() => setHarvestId(m.id)}
            />
          );
        })}
      </MapContainer>

      <div className="map-ui legend">
        <button
          className="btn small ghost"
          type="button"
          onClick={() => setLegendOpen((v) => !v)}
          style={{ width: '100%', marginBottom: legendOpen ? 8 : 0 }}
        >
          {legendOpen ? 'Hide legend' : 'Legend'}
        </button>
        {legendOpen && (
          <>
            <h2>Ranch map</h2>
            <div className="legend-row">
              <span className="swatch lane" /> Yellow · boundary &amp; lanes
            </div>
            <div className="legend-row">
              <span className="swatch laguna" /> Laguna · ~2-acre pond
            </div>
            <div className="legend-row">
              <span className="swatch well" /> Well / camp
            </div>
            <div className="legend-row">
              <span className="swatch blind" /> Blind
            </div>
            <div className="legend-row">
              <span className="swatch feeder" /> Feeder
            </div>
            <div className="legend-row">
              <span className="swatch busy" /> Occupied blind
            </div>
            <p className="meta" style={{ margin: '8px 0 0' }}>
              Pinch to zoom · drag to pan
              {admin ? ' · drag pins to move' : ''}
            </p>
          </>
        )}
      </div>

      {admin && (
        <div className="map-ui map-tools">
          <button
            className={`btn small${placing === 'blind' ? ' primary' : ''}`}
            type="button"
            onClick={() => setPlacing((p) => (p === 'blind' ? null : 'blind'))}
          >
            + Blind
          </button>
          <button
            className={`btn small${placing === 'feeder' ? ' primary' : ''}`}
            type="button"
            onClick={() => setPlacing((p) => (p === 'feeder' ? null : 'feeder'))}
          >
            + Feeder
          </button>
        </div>
      )}

      {placing && (
        <div className="map-ui place-banner">
          Tap the map to place a {placing}. Stay on lanes, overlook Laguna, keep
          clear of the well/camp.
        </div>
      )}

      {editing && (
        <MarkerEditor marker={editing} onClose={() => setEditId(null)} />
      )}
      {checking && (
        <CheckInForm marker={checking} onClose={() => setCheckInId(null)} />
      )}
      {harvestId && (
        <HarvestForm
          presetMarkerId={harvestId}
          onClose={() => setHarvestId(null)}
        />
      )}
    </>
  );
}

export const mapSizeNote = `${MAP_WIDTH}×${MAP_HEIGHT}`;
