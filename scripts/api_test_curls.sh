#!/bin/bash

# --- Configuration ---
export BASE_URL="http://localhost:5000/api" # Adjust if your port is different

# --- Helper Function to Display Command and Execute ---
run_curl() {
    echo ""
    echo "----------------------------------------------------------------------"
    echo "EXECUTING: $1"
    echo "COMMAND:"
    echo "$2"
    echo "----------------------------------------------------------------------"
    echo "RESPONSE:"
    eval "$2" # Execute the command
    echo ""
    echo "----------------------------------------------------------------------"
}

# --- Initial User Data (Modify as needed) ---
RIDER_NAME="Test Rider"
RIDER_EMAIL="rider$(date +%s%N | cut -b1-13)@example.com" # Unique email
RIDER_PHONE="1234567890$(date +%s | tail -c 2)"           # Unique phone
RIDER_PASSWORD="password123"

DRIVER_NAME="Test Driver"
DRIVER_EMAIL="driver$(date +%s%N | cut -b1-13)@example.com" # Unique email
DRIVER_PHONE="0987654321$(date +%s | tail -c 2)"            # Unique phone
DRIVER_PASSWORD="password123"
DRIVER_VEHICLE_REG="DRV-001"
DRIVER_VEHICLE_LIC="LIC-001"

echo "LyftSync API Test Script"
echo "Make sure your server is running at $BASE_URL"
echo "This script uses 'jq' to parse JSON. Install it if you haven't."
echo "Press Enter to continue with each step..."
read -r

# --- 1. Auth Endpoints ---

# 1.1 Register Rider
CMD_REGISTER_RIDER="curl -s -X POST \"$BASE_URL/auth/register\" \
  -H \"Content-Type: application/json\" \
  -d '{
    \"name\": \"$RIDER_NAME\",
    \"email\": \"$RIDER_EMAIL\",
    \"password\": \"$RIDER_PASSWORD\",
    \"phone\": \"$RIDER_PHONE\",
    \"role\": \"rider\"
  }'"
run_curl "1.1 Register Rider" "$CMD_REGISTER_RIDER"
RIDER_REG_RESPONSE=$(eval "$CMD_REGISTER_RIDER")
RIDER_USER_ID=$(echo "$RIDER_REG_RESPONSE" | jq -r '._id') # Capture response
export RIDER_USER_ID
echo "RIDER_USER_ID set to: $RIDER_USER_ID"
read -r

# 1.2 Login Rider
CMD_LOGIN_RIDER="curl -s -X POST \"$BASE_URL/auth/login\" \
  -H \"Content-Type: application/json\" \
  -d '{
    \"email\": \"$RIDER_EMAIL\",
    \"password\": \"$RIDER_PASSWORD\"
  }'"
run_curl "1.2 Login Rider" "$CMD_LOGIN_RIDER"
RIDER_LOGIN_RESPONSE=$(eval "$CMD_LOGIN_RIDER")
RIDER_TOKEN=$(echo "$RIDER_LOGIN_RESPONSE" | jq -r '.token') # Capture response
export RIDER_TOKEN
if [ "$RIDER_TOKEN" == "null" ] || [ -z "$RIDER_TOKEN" ]; then
    echo "Failed to get RIDER_TOKEN. Exiting."
    exit 1
fi
echo "RIDER_TOKEN set."
read -r

# 1.3 Register Driver
CMD_REGISTER_DRIVER="curl -s -X POST \"$BASE_URL/auth/register\" \
  -H \"Content-Type: application/json\" \
  -d '{
    \"name\": \"$DRIVER_NAME\",
    \"email\": \"$DRIVER_EMAIL\",
    \"password\": \"$DRIVER_PASSWORD\",
    \"phone\": \"$DRIVER_PHONE\",
    \"role\": \"driver\",
    \"vehicleDetails\": {
      \"type\": \"motorbike\",
      \"registrationNumber\": \"$DRIVER_VEHICLE_REG\",
      \"licenseNumber\": \"$DRIVER_VEHICLE_LIC\",
      \"model\": \"Honda CBR\"
    }
  }'"
run_curl "1.3 Register Driver" "$CMD_REGISTER_DRIVER"
DRIVER_REG_RESPONSE=$(eval "$CMD_REGISTER_DRIVER")
DRIVER_USER_ID=$(echo "$DRIVER_REG_RESPONSE" | jq -r '._id')
export DRIVER_USER_ID
echo "DRIVER_USER_ID set to: $DRIVER_USER_ID"
read -r

# 1.4 Login Driver
CMD_LOGIN_DRIVER="curl -s -X POST \"$BASE_URL/auth/login\" \
  -H \"Content-Type: application/json\" \
  -d '{
    \"email\": \"$DRIVER_EMAIL\",
    \"password\": \"$DRIVER_PASSWORD\"
  }'"
run_curl "1.4 Login Driver" "$CMD_LOGIN_DRIVER"
DRIVER_LOGIN_RESPONSE=$(eval "$CMD_LOGIN_DRIVER") # Capture response
DRIVER_TOKEN=$(echo "$DRIVER_LOGIN_RESPONSE" | jq -r '.token')
export DRIVER_TOKEN
if [ "$DRIVER_TOKEN" == "null" ] || [ -z "$DRIVER_TOKEN" ]; then
    echo "Failed to get DRIVER_TOKEN. Exiting."
    exit 1
fi
echo "DRIVER_TOKEN set."
read -r

# 1.5 Get Current User (Rider)
CMD_GET_ME_RIDER="curl -s -X GET \"$BASE_URL/auth/me\" \
  -H \"Authorization: Bearer $RIDER_TOKEN\""
run_curl "1.5 Get Current User (Rider)" "$CMD_GET_ME_RIDER"
read -r

# 1.6 Get Current User (Driver)
CMD_GET_ME_DRIVER="curl -s -X GET \"$BASE_URL/auth/me\" \
  -H \"Authorization: Bearer $DRIVER_TOKEN\""
run_curl "1.6 Get Current User (Driver)" "$CMD_GET_ME_DRIVER"
read -r

# --- 2. User Endpoints ---

# 2.1 Update Rider Profile
CMD_UPDATE_RIDER_PROFILE="curl -s -X PUT \"$BASE_URL/users/profile\" \
  -H \"Content-Type: application/json\" \
  -H \"Authorization: Bearer $RIDER_TOKEN\" \
  -d '{
    \"name\": \"$RIDER_NAME Updated\",
    \"profilePictureUrl\": \"http://example.com/newpic.jpg\",
    \"emergencyContacts\": [{\"name\": \"Emergency Contact 1\", \"phone\": \"5551234\"}]
  }'"
run_curl "2.1 Update Rider Profile" "$CMD_UPDATE_RIDER_PROFILE"
read -r

# 2.2 Update Driver Profile (e.g., become 'both')
CMD_UPDATE_DRIVER_PROFILE_TO_BOTH="curl -s -X PUT \"$BASE_URL/users/profile\" \
  -H \"Content-Type: application/json\" \
  -H \"Authorization: Bearer $DRIVER_TOKEN\" \
  -d '{
    \"name\": \"$DRIVER_NAME Updated\",
    \"role\": \"both\",
    \"vehicleDetails\": {
      \"type\": \"scooter\",
      \"registrationNumber\": \"$DRIVER_VEHICLE_REG-UPDATED\",
      \"licenseNumber\": \"$DRIVER_VEHICLE_LIC-UPDATED\",
      \"model\": \"Yamaha NMAX\"
    }
  }'"
run_curl "2.2 Update Driver Profile to Role 'both'" "$CMD_UPDATE_DRIVER_PROFILE_TO_BOTH"
read -r

# 2.3 Get Public Profile of Rider
CMD_GET_RIDER_PROFILE="curl -s -X GET \"$BASE_URL/users/$RIDER_USER_ID\""
run_curl "2.3 Get Public Profile of Rider (ID: $RIDER_USER_ID)" "$CMD_GET_RIDER_PROFILE"
read -r

# 2.4 Get Public Profile of Driver
CMD_GET_DRIVER_PROFILE="curl -s -X GET \"$BASE_URL/users/$DRIVER_USER_ID\""
run_curl "2.4 Get Public Profile of Driver (ID: $DRIVER_USER_ID)" "$CMD_GET_DRIVER_PROFILE"
read -r

# --- 3. Ride Endpoints ---

# 3.1 Create Ride (Driver)
DEPARTURE_TIME=$(date -u -d "+1 hour" +"%Y-%m-%dT%H:%M:%S.%3NZ")
ESTIMATED_ARRIVAL_TIME=$(date -u -d "+2 hours" +"%Y-%m-%dT%H:%M:%S.%3NZ")

CMD_CREATE_RIDE="curl -s -X POST \"$BASE_URL/rides\" \
  -H \"Content-Type: application/json\" \
  -H \"Authorization: Bearer $DRIVER_TOKEN\" \
  -d '{
    \"startLocation\": { \"coordinates\": [106.8456, -6.2088], \"address\": \"Central Jakarta\" },
    \"endLocation\": { \"coordinates\": [106.8272, -6.1751], \"address\": \"North Jakarta\" },
    \"departureTime\": \"$DEPARTURE_TIME\",
    \"estimatedArrivalTime\": \"$ESTIMATED_ARRIVAL_TIME\",
    \"availableSeats\": 3,
    \"pricePerSeat\": 50000,
    \"notes\": \"Cash only, no pets\"
  }'"
run_curl "3.1 Create Ride (Driver)" "$CMD_CREATE_RIDE"
CREATE_RIDE_RESPONSE=$(eval "$CMD_CREATE_RIDE")
RIDE_ID=$(echo "$CREATE_RIDE_RESPONSE" | jq -r '._id')
export RIDE_ID
if [ "$RIDE_ID" == "null" ] || [ -z "$RIDE_ID" ]; then
    echo "Failed to create ride. Exiting."
    exit 1
fi
echo "RIDE_ID set to: $RIDE_ID"
read -r

# 3.2 Search Rides (Public)
CMD_SEARCH_RIDES="curl -s -X GET \"$BASE_URL/rides?fromLng=106.845&fromLat=-6.208&seats=1&maxDistanceKm=5\""
run_curl "3.2 Search Rides" "$CMD_SEARCH_RIDES"
read -r

# 3.3 Get Rides Offered by Logged-in Driver
CMD_GET_MY_OFFERED_RIDES="curl -s -X GET \"$BASE_URL/rides/my-offered\" \
  -H \"Authorization: Bearer $DRIVER_TOKEN\""
run_curl "3.3 Get Rides Offered by Logged-in Driver" "$CMD_GET_MY_OFFERED_RIDES"
read -r

# 3.4 Get Specific Ride Details (Public)
CMD_GET_RIDE_BY_ID="curl -s -X GET \"$BASE_URL/rides/$RIDE_ID\""
run_curl "3.4 Get Specific Ride Details (ID: $RIDE_ID)" "$CMD_GET_RIDE_BY_ID"
read -r

# 3.5 Update Ride Details (Driver, Owner only)
NEW_DEPARTURE_TIME=$(date -u -d "+3 hours" +"%Y-%m-%dT%H:%M:%S.%3NZ")
CMD_UPDATE_RIDE="curl -s -X PUT \"$BASE_URL/rides/$RIDE_ID\" \
  -H \"Content-Type: application/json\" \
  -H \"Authorization: Bearer $DRIVER_TOKEN\" \
  -d '{
    \"availableSeats\": 2,
    \"pricePerSeat\": 55000,
    \"notes\": \"Updated notes: Card payment accepted.\",
    \"departureTime\": \"$NEW_DEPARTURE_TIME\"
  }'"
run_curl "3.5 Update Ride Details (ID: $RIDE_ID)" "$CMD_UPDATE_RIDE"
read -r

# --- 4. Booking Endpoints ---

# 4.1 Create Booking (Rider makes a request for the ride created by Driver)
# Note: This uses the RIDE_ID obtained from step 3.1
CMD_CREATE_BOOKING="curl -s -X POST \"$BASE_URL/rides/$RIDE_ID/bookings\" \
  -H \"Content-Type: application/json\" \
  -H \"Authorization: Bearer $RIDER_TOKEN\" \
  -d '{
    \"requestedSeats\": 1
  }'"
run_curl "4.1 Create Booking (Rider for Ride ID: $RIDE_ID)" "$CMD_CREATE_BOOKING"
CREATE_BOOKING_RESPONSE=$(eval "$CMD_CREATE_BOOKING")
BOOKING_ID=$(echo "$CREATE_BOOKING_RESPONSE" | jq -r '._id')
export BOOKING_ID
if [ "$BOOKING_ID" == "null" ] || [ -z "$BOOKING_ID" ]; then
    echo "Failed to create booking. Exiting."
    exit 1
fi
echo "BOOKING_ID set to: $BOOKING_ID"
read -r

# 4.2 Get Booking Requests for Driver's Ride
# Note: Uses RIDE_ID from 3.1 and DRIVER_TOKEN
CMD_GET_RIDE_BOOKINGS="curl -s -X GET \"$BASE_URL/rides/$RIDE_ID/bookings\" \
  -H \"Authorization: Bearer $DRIVER_TOKEN\""
run_curl "4.2 Get Booking Requests for Driver's Ride (Ride ID: $RIDE_ID)" "$CMD_GET_RIDE_BOOKINGS"
read -r

# 4.3 Update Booking Status (Driver Accepts)
# Note: Uses BOOKING_ID from 4.1 and DRIVER_TOKEN
CMD_ACCEPT_BOOKING="curl -s -X PATCH \"$BASE_URL/bookings/$BOOKING_ID/status\" \
  -H \"Content-Type: application/json\" \
  -H \"Authorization: Bearer $DRIVER_TOKEN\" \
  -d '{
    \"status\": \"accepted\"
  }'"
run_curl "4.3 Update Booking Status (Driver Accepts Booking ID: $BOOKING_ID)" "$CMD_ACCEPT_BOOKING"
read -r

# 4.4 Get Rider's Booking Requests
CMD_GET_MY_BOOKING_REQUESTS="curl -s -X GET \"$BASE_URL/bookings/my-requests\" \
  -H \"Authorization: Bearer $RIDER_TOKEN\""
run_curl "4.4 Get Rider's Booking Requests" "$CMD_GET_MY_BOOKING_REQUESTS"
read -r

# 4.5 Get Specific Booking Details (Rider)
CMD_GET_BOOKING_BY_ID_RIDER="curl -s -X GET \"$BASE_URL/bookings/$BOOKING_ID\" \
  -H \"Authorization: Bearer $RIDER_TOKEN\""
run_curl "4.5 Get Specific Booking Details by Rider (Booking ID: $BOOKING_ID)" "$CMD_GET_BOOKING_BY_ID_RIDER"
read -r

# 4.6 Get Specific Booking Details (Driver)
CMD_GET_BOOKING_BY_ID_DRIVER="curl -s -X GET \"$BASE_URL/bookings/$BOOKING_ID\" \
  -H \"Authorization: Bearer $DRIVER_TOKEN\""
run_curl "4.6 Get Specific Booking Details by Driver (Booking ID: $BOOKING_ID)" "$CMD_GET_BOOKING_BY_ID_DRIVER"
read -r

# 4.7 Update Booking Status (Rider Cancels an accepted booking)
# Note: Uses BOOKING_ID from 4.1 and RIDER_TOKEN
CMD_CANCEL_BOOKING_RIDER="curl -s -X PATCH \"$BASE_URL/bookings/$BOOKING_ID/status\" \
  -H \"Content-Type: application/json\" \
  -H \"Authorization: Bearer $RIDER_TOKEN\" \
  -d '{
    \"status\": \"cancelled_by_rider\"
  }'"
# For testing, let's re-create and accept a booking first if the previous one was cancelled
echo "Re-creating and accepting a booking for cancellation test..."
eval "$CMD_CREATE_BOOKING" >/dev/null                                                                                                                                                                         # re-create
TEMP_BOOKING_ID_FOR_CANCEL=$(eval "$CMD_CREATE_BOOKING" | jq -r '._id')                                                                                                                                       # get new ID
eval "curl -s -X PATCH \"$BASE_URL/bookings/$TEMP_BOOKING_ID_FOR_CANCEL/status\" -H \"Content-Type: application/json\" -H \"Authorization: Bearer $DRIVER_TOKEN\" -d '{\"status\": \"accepted\"}'" >/dev/null # driver accepts
CMD_CANCEL_BOOKING_RIDER=$(echo "$CMD_CANCEL_BOOKING_RIDER" | sed "s/$BOOKING_ID/$TEMP_BOOKING_ID_FOR_CANCEL/g")                                                                                              # update command with new ID
run_curl "4.7 Update Booking Status (Rider Cancels Booking ID: $TEMP_BOOKING_ID_FOR_CANCEL)" "$CMD_CANCEL_BOOKING_RIDER"
read -r

# --- Back to Ride Status Updates ---

# 4.8 Driver Starts Ride
# Note: Uses RIDE_ID from 3.1 and DRIVER_TOKEN
CMD_START_RIDE="curl -s -X PATCH \"$BASE_URL/rides/$RIDE_ID/status\" \
  -H \"Content-Type: application/json\" \
  -H \"Authorization: Bearer $DRIVER_TOKEN\" \
  -d '{
    \"status\": \"active\"
  }'"
run_curl "4.8 Driver Starts Ride (Ride ID: $RIDE_ID)" "$CMD_START_RIDE"
read -r

# 4.9 Driver Completes Ride
# Note: Uses RIDE_ID from 3.1 and DRIVER_TOKEN
CMD_COMPLETE_RIDE="curl -s -X PATCH \"$BASE_URL/rides/$RIDE_ID/status\" \
  -H \"Content-Type: application/json\" \
  -H \"Authorization: Bearer $DRIVER_TOKEN\" \
  -d '{
    \"status\": \"completed\"
  }'"
run_curl "4.9 Driver Completes Ride (Ride ID: $RIDE_ID)" "$CMD_COMPLETE_RIDE"
read -r

# --- 5. Review Endpoints ---
# (Assuming RIDE_ID is for a completed ride and BOOKING_ID corresponds to a booking on that ride
# where Rider was RIDER_USER_ID and Driver was DRIVER_USER_ID)

# Ensure the booking for review is also marked completed.
# This should happen automatically when ride status becomes "completed" if the booking was "accepted".
# Let's re-create a full flow for review to be safe.

echo "Setting up a completed ride and booking for review testing..."
# New Driver
NEW_DRIVER_EMAIL="driver_review_test_$(date +%s%N | cut -b1-13)@example.com"
NEW_DRIVER_PHONE="0987654321$(date +%s | tail -c 3)"
eval "curl -s -X POST \"$BASE_URL/auth/register\" -H \"Content-Type: application/json\" -d '{\"name\": \"Driver ReviewTest\", \"email\": \"$NEW_DRIVER_EMAIL\", \"password\": \"password123\", \"phone\": \"$NEW_DRIVER_PHONE\", \"role\": \"driver\", \"vehicleDetails\": {\"type\": \"motorbike\", \"registrationNumber\": \"REV-DRV-001\", \"licenseNumber\": \"REV-LIC-001\"}}'" >/dev/null
NEW_DRIVER_LOGIN_RESP=$(eval "curl -s -X POST \"$BASE_URL/auth/login\" -H \"Content-Type: application/json\" -d '{\"email\": \"$NEW_DRIVER_EMAIL\", \"password\": \"password123\"}'")
NEW_DRIVER_TOKEN=$(echo "$NEW_DRIVER_LOGIN_RESP" | jq -r '.token')
NEW_DRIVER_USER_ID=$(echo "$NEW_DRIVER_LOGIN_RESP" | jq -r '._id')

# New Rider
NEW_RIDER_EMAIL="rider_review_test_$(date +%s%N | cut -b1-13)@example.com"
NEW_RIDER_PHONE="1234567890$(date +%s | tail -c 3)"
eval "curl -s -X POST \"$BASE_URL/auth/register\" -H \"Content-Type: application/json\" -d '{\"name\": \"Rider ReviewTest\", \"email\": \"$NEW_RIDER_EMAIL\", \"password\": \"password123\", \"phone\": \"$NEW_RIDER_PHONE\", \"role\": \"rider\"}'" >/dev/null
NEW_RIDER_LOGIN_RESP=$(eval "curl -s -X POST \"$BASE_URL/auth/login\" -H \"Content-Type: application/json\" -d '{\"email\": \"$NEW_RIDER_EMAIL\", \"password\": \"password123\"}'")
NEW_RIDER_TOKEN=$(echo "$NEW_RIDER_LOGIN_RESP" | jq -r '.token')
NEW_RIDER_USER_ID=$(echo "$NEW_RIDER_LOGIN_RESP" | jq -r '._id')

# New Ride by New Driver
NEW_DEPARTURE_TIME_REVIEW=$(date -u -d "+10 minutes" +"%Y-%m-%dT%H:%M:%S.%3NZ")
NEW_RIDE_FOR_REVIEW_RESP=$(eval "curl -s -X POST \"$BASE_URL/rides\" -H \"Content-Type: application/json\" -H \"Authorization: Bearer $NEW_DRIVER_TOKEN\" -d '{\"startLocation\": { \"coordinates\": [100.0, -6.0], \"address\": \"Origin Review\" }, \"endLocation\": { \"coordinates\": [101.0, -7.0], \"address\": \"Dest Review\" }, \"departureTime\": \"$NEW_DEPARTURE_TIME_REVIEW\", \"availableSeats\": 1, \"pricePerSeat\": 10000}'")
NEW_RIDE_ID_FOR_REVIEW=$(echo "$NEW_RIDE_FOR_REVIEW_RESP" | jq -r '._id')

# New Rider books New Ride
NEW_BOOKING_FOR_REVIEW_RESP=$(eval "curl -s -X POST \"$BASE_URL/rides/$NEW_RIDE_ID_FOR_REVIEW/bookings\" -H \"Content-Type: application/json\" -H \"Authorization: Bearer $NEW_RIDER_TOKEN\" -d '{\"requestedSeats\": 1}'")
NEW_BOOKING_ID_FOR_REVIEW=$(echo "$NEW_BOOKING_FOR_REVIEW_RESP" | jq -r '._id')

# New Driver accepts booking
eval "curl -s -X PATCH \"$BASE_URL/bookings/$NEW_BOOKING_ID_FOR_REVIEW/status\" -H \"Content-Type: application/json\" -H \"Authorization: Bearer $NEW_DRIVER_TOKEN\" -d '{\"status\": \"accepted\"}'" >/dev/null
# New Driver completes ride
eval "curl -s -X PATCH \"$BASE_URL/rides/$NEW_RIDE_ID_FOR_REVIEW/status\" -H \"Content-Type: application/json\" -H \"Authorization: Bearer $NEW_DRIVER_TOKEN\" -d '{\"status\": \"completed\"}'" >/dev/null
echo "Setup for review complete. Ride ID: $NEW_RIDE_ID_FOR_REVIEW, Driver ID: $NEW_DRIVER_USER_ID, Rider ID: $NEW_RIDER_USER_ID"
read -r

# 5.1 Post Review (Rider reviews Driver)
CMD_POST_REVIEW_RIDER_TO_DRIVER="curl -s -X POST \"$BASE_URL/reviews\" \
  -H \"Content-Type: application/json\" \
  -H \"Authorization: Bearer $NEW_RIDER_TOKEN\" \
  -d '{
    \"rideId\": \"$NEW_RIDE_ID_FOR_REVIEW\",
    \"revieweeId\": \"$NEW_DRIVER_USER_ID\",
    \"rating\": 5,
    \"comment\": \"Great driver, smooth ride!\",
    \"reviewType\": \"driver_review\"
  }'"
run_curl "5.1 Post Review (Rider reviews Driver)" "$CMD_POST_REVIEW_RIDER_TO_DRIVER"
read -r

# 5.2 Post Review (Driver reviews Rider)
CMD_POST_REVIEW_DRIVER_TO_RIDER="curl -s -X POST \"$BASE_URL/reviews\" \
  -H \"Content-Type: application/json\" \
  -H \"Authorization: Bearer $NEW_DRIVER_TOKEN\" \
  -d '{
    \"rideId\": \"$NEW_RIDE_ID_FOR_REVIEW\",
    \"revieweeId\": \"$NEW_RIDER_USER_ID\",
    \"rating\": 4,
    \"comment\": \"Punctual and friendly rider.\",
    \"reviewType\": \"rider_review\"
  }'"
run_curl "5.2 Post Review (Driver reviews Rider)" "$CMD_POST_REVIEW_DRIVER_TO_RIDER"
read -r

# 5.3 Get Reviews for Driver
CMD_GET_DRIVER_REVIEWS="curl -s -X GET \"$BASE_URL/users/$NEW_DRIVER_USER_ID/reviews\""
run_curl "5.3 Get Reviews for Driver (ID: $NEW_DRIVER_USER_ID)" "$CMD_GET_DRIVER_REVIEWS"
read -r

# 5.4 Get Reviews for Rider
CMD_GET_RIDER_REVIEWS="curl -s -X GET \"$BASE_URL/users/$NEW_RIDER_USER_ID/reviews\""
run_curl "5.4 Get Reviews for Rider (ID: $NEW_RIDER_USER_ID)" "$CMD_GET_RIDER_REVIEWS"
read -r

# --- Other Ride Statuses ---
# 4.10 Driver Cancels Ride (if ride was 'pending' or 'active')
# Re-create a ride to test cancellation
NEW_DEPARTURE_TIME_CANCEL=$(date -u -d "+1 hour" +"%Y-%m-%dT%H:%M:%S.%3NZ")
CMD_CREATE_RIDE_FOR_CANCEL="curl -s -X POST \"$BASE_URL/rides\" \
  -H \"Content-Type: application/json\" \
  -H \"Authorization: Bearer $DRIVER_TOKEN\" \
  -d '{
    \"startLocation\": { \"coordinates\": [106.9, -6.3], \"address\": \"Another Place\" },
    \"endLocation\": { \"coordinates\": [106.1, -6.0], \"address\": \"Somewhere Else\" },
    \"departureTime\": \"$NEW_DEPARTURE_TIME_CANCEL\",
    \"availableSeats\": 1
  }'"
CREATE_RIDE_FOR_CANCEL_RESPONSE=$(eval "$CMD_CREATE_RIDE_FOR_CANCEL")
RIDE_ID_FOR_CANCEL=$(echo "$CREATE_RIDE_FOR_CANCEL_RESPONSE" | jq -r '._id')
echo "Created Ride ID for cancellation test: $RIDE_ID_FOR_CANCEL"

CMD_CANCEL_RIDE_DRIVER="curl -s -X PATCH \"$BASE_URL/rides/$RIDE_ID_FOR_CANCEL/status\" \
  -H \"Content-Type: application/json\" \
  -H \"Authorization: Bearer $DRIVER_TOKEN\" \
  -d '{
    \"status\": \"cancelled_by_driver\"
  }'"
run_curl "4.10 Driver Cancels Ride (Ride ID: $RIDE_ID_FOR_CANCEL)" "$CMD_CANCEL_RIDE_DRIVER"
read -r

echo "All tests finished. Check responses above."
