import db from "../db/knex.js";

const RIDES_TABLE = "rides";
const WAYPOINTS_TABLE = "waypoints";

export const Ride = {
  async createWithWaypoints(rideData, waypointsData) {
    return db.transaction(async (trx) => {
      const [newRide] = await trx(RIDES_TABLE).insert(rideData).returning("*");

      const waypointsToInsert = waypointsData.map((wp) => ({
        ...wp,
        ride_id: newRide.id,
        location: db.raw("ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography", [
          wp.longitude,
          wp.latitude,
        ]),
        latitude: wp.latitude,
        longitude: wp.longitude,
      }));

      const newWaypoints = await trx(WAYPOINTS_TABLE)
        .insert(waypointsToInsert)
        .returning("*");

      return { ...newRide, waypoints: newWaypoints };
    });
  },

  async findById(id) {
    return db(RIDES_TABLE).where({ id }).first();
  },

  async findByIdWithWaypoints(id) {
    const ride = await db(RIDES_TABLE).where({ id }).first();
    if (!ride) return null;

    const waypoints = await db(WAYPOINTS_TABLE)
      .where({ ride_id: id })
      .orderBy("sequence_order", "asc");

    const waypointsWithCoords = waypoints.map((wp) => ({
      ...wp,
      location: undefined,
    }));

    return { ...ride, waypoints: waypointsWithCoords };
  },
};
