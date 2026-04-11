import L from 'leaflet';

/**
 * OSRM route endpoint (no trailing slash).
 * Set VITE_OSRM_SERVICE_URL in .env to your own OSRM / compatible API for production.
 * @see https://github.com/Project-OSRM/osrm-backend/wiki/Api-usage-policy
 */
export const OSRM_SERVICE_URL = (
  import.meta.env.VITE_OSRM_SERVICE_URL || 'https://router.project-osrm.org/route/v1'
).replace(/\/$/, '');

export function createOsrmRouter() {
  return L.Routing.osrmv1({
    serviceUrl: OSRM_SERVICE_URL,
    profile: 'driving',
  });
}

/** Options for L.Routing.control (new router per map instance). */
export function getRoutingControlBase() {
  return {
    routeWhileDragging: false,
    showAlternatives: false,
    fitSelectedRoutes: true,
    show: false,
    lineOptions: {
      styles: [{ color: '#10b981', weight: 4, opacity: 0.7 }],
    },
    router: createOsrmRouter(),
  };
}
