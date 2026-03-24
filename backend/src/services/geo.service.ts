import { query } from '../config/database';

export const GeoService = {

  // Find which locality a GPS point belongs to
  findLocality: async (lat: number, lng: number): Promise<any | null> => {
    const result = await query(
      `SELECT * FROM localities
       WHERE ST_DWithin(
         center,
         ST_SetSRID(ST_MakePoint($2, $1), 4326)::GEOGRAPHY,
         radius_meters
       )
       ORDER BY ST_Distance(
         center,
         ST_SetSRID(ST_MakePoint($2, $1), 4326)::GEOGRAPHY
       ) ASC
       LIMIT 1`,
      [lat, lng]
    );
    return result.rows[0] || null;
  },

  // Get distance in meters between two points
  getDistance: async (
    lat1: number, lng1: number,
    lat2: number, lng2: number
  ): Promise<number> => {
    const result = await query(
      `SELECT ST_Distance(
        ST_SetSRID(ST_MakePoint($2, $1), 4326)::GEOGRAPHY,
        ST_SetSRID(ST_MakePoint($4, $3), 4326)::GEOGRAPHY
      ) as distance`,
      [lat1, lng1, lat2, lng2]
    );
    return result.rows[0].distance;
  },

  // Get nearest N users to a point (for SMS fallback)
  getNearestUsers: async (
    lat: number, lng: number,
    radius_meters: number,
    limit: number = 10,
    smsOptInOnly: boolean = true
  ): Promise<any[]> => {
    const result = await query(
      `SELECT id, phone, name,
        ST_Distance(
          location,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::GEOGRAPHY
        ) as distance_meters
       FROM users
       WHERE
         is_active = TRUE
         AND location IS NOT NULL
         AND ($5 = FALSE OR sms_opt_in = TRUE)
         AND ST_DWithin(
           location,
           ST_SetSRID(ST_MakePoint($2, $1), 4326)::GEOGRAPHY,
           $3
         )
       ORDER BY distance_meters ASC
       LIMIT $4`,
      [lat, lng, radius_meters, limit, smsOptInOnly]
    );
    return result.rows;
  },
};
