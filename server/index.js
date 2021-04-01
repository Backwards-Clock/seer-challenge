const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors()); // so that app can access
app.use(express.json());

const formatBookings = (bookings) => {
  return bookings.map((bookingRecord) => ({
    time: Date.parse(bookingRecord.time),
    duration: bookingRecord.duration * 60 * 1000, // mins into ms
    userId: bookingRecord.user_id,
  }));
};

const bookings = formatBookings(
  JSON.parse(fs.readFileSync("./server/bookings.json"))
);

app.get("/bookings", (_, res) => {
  res.json(bookings);
});

app.post("/bookings", (req, res) => {
  const bookings = JSON.parse(fs.readFileSync("./server/bookings.json"));
  req.body.forEach((newBooking) => {
    // format the new bookings to be the same as the existing data
    // TODO: The datetime format is different to the existing data but still saves/converts fine
    const newDate = new Date(newBooking.time);
    const formattedBooking = {
      time: newDate,
      duration: newBooking.duration / (60 * 1000),
      user_id: newBooking.userId,
    };
    bookings.push(formattedBooking);
  });

  // write to file
  fs.writeFile("./server/bookings.json", JSON.stringify(bookings), (err) => {
    if (err) {
      console.log("Unable to write to file", err);
    } else {
      const responseData = formatBookings(bookings);
      res.json(responseData);
    }
  });
});

app.listen(3001);
