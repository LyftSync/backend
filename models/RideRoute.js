import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

export async function createRideRoute(rideId, route) {
  const db = getDB();
  const routeData = {
    rideId: new ObjectId(rideId),
    route: {
      type: 'LineString',
      coordinates: route.map(([lat, lng]) => [lng, lat]), // Convert [lat, lng] to [lng, lat]
    },
    createdAt: new Date(),
  };
  const result = await db.collection('ride_routes').insertOne(routeData);
  return { ...routeData, _id: result.insertedId };
}

export async function findRouteByRideId(rideId) {
  const db = getDB();
  const routeData = await db.collection('ride_routes').findOne({ rideId: new ObjectId(rideId) });
  if (routeData) {
    // Convert back to array of [lat, lng] for API consistency
    routeData.route = routeData.route.coordinates.map(([lng, lat]) => [lat, lng]);
  }
  return routeData;
}
