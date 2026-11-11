import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapPlace = {
  id: string;
  short: string;
  area: string;
  lat: number;
  lon: number;
  onSelect?: () => void;
};

/** Zoom used when a single kitchen is focused — close enough to read the street. */
const CLOSE_ZOOM = 16;

/** Gold teardrop pin with the kitchen's name beside it, styled from visit.css. */
function pinIcon(place: MapPlace) {
  return L.divIcon({
    className: "mappin-wrap",
    html: `<span class="mappin" aria-hidden="true"></span>
<span class="mappin__label"><strong>${place.short}</strong><span>${place.area}</span></span>`,
    // Anchor on the pin's point, not the middle of the label.
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

/**
 * Real street map of Dubai with both kitchens pinned.
 *
 * Scroll-wheel zoom stays off so the page keeps scrolling past the hero; drag,
 * double-click and the +/- control still zoom.
 */
export function createCityMap(container: HTMLElement, places: MapPlace[]) {
  const map = L.map(container, {
    scrollWheelZoom: false,
    zoomControl: true,
    attributionControl: true,
  });

  // Standard OpenStreetMap tiles: real streets, no API key. Attribution is
  // required by the licence and is rendered by Leaflet's attribution control.
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  const markers = places.map((p) => {
    const m = L.marker([p.lat, p.lon], {
      icon: pinIcon(p),
      title: p.short,
      keyboard: true,
      alt: `${p.short} kitchen`,
    }).addTo(map);
    if (p.onSelect) m.on("click keypress", p.onSelect);
    return m;
  });

  const bounds = L.latLngBounds(places.map((p) => [p.lat, p.lon] as [number, number]));
  /**
   * Pin labels hang to the right of their point and the view toggle sits along
   * the bottom, so the fit is deliberately lopsided rather than even.
   */
  const FIT = { paddingTopLeft: [50, 70] as [number, number], paddingBottomRight: [190, 90] as [number, number] };
  map.fitBounds(bounds, { ...FIT, animate: false });

  // Leaflet measures the container on creation; re-measure once the hero has
  // settled and whenever it is resized, or tiles come out grey.
  const ro = new ResizeObserver(() => map.invalidateSize());
  ro.observe(container);

  return {
    focus(i: number) {
      const place = places[i];
      if (!place) {
        markers.forEach((m) => m.getElement()?.classList.remove("is-active"));
        map.flyToBounds(bounds, { ...FIT, duration: 0.8 });
        return;
      }
      map.flyTo([place.lat, place.lon], CLOSE_ZOOM, { duration: 0.8 });
      markers.forEach((m, j) => m.getElement()?.classList.toggle("is-active", i === j));
    },
    dispose() {
      ro.disconnect();
      map.remove();
    },
  };
}
