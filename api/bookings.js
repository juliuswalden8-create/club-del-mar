const { handleBookingsApi, createRequestUrl } = require("../lib/bookings-api");

module.exports = async function handler(request, response) {
  const requestUrl = createRequestUrl(request, "https://club-del-mar.local");
  await handleBookingsApi(request, response, requestUrl);
};
