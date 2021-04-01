import React, { useState, useEffect } from "react";
import Dropzone from "react-dropzone";
import csv from "csv";
import moment from "moment";
import BookingsTimeline from "./components/BookingsTimeline";
import "./App.css";

const apiUrl = "http://localhost:3001";

export const App = () => {
  const [bookings, setBookings] = useState([]);
  const [newBookings, setNewBookings] = useState([]);
  const [timelineFormattedBookings, setTimelineFormattedBookings] = useState(
    []
  );

  useEffect(() => {
    fetch(`${apiUrl}/bookings`)
      .then((response) => response.json())
      .then(setBookings);
  }, []);

  // Compare and format the bookings data, each time bookings or newBookings changes
  useEffect(() => {
    compareBookings(newBookings, bookings);
    const formattedExistingBookings = formatBookings(
      bookings,
      existingBookingsGroup
    );
    const formattedNewBookings = formatBookings(newBookings, newBookingsGroup);
    const allBookings = formattedExistingBookings.concat(formattedNewBookings);

    // Timeline components requires a list of all items with a unique ID
    const formattedAllBookings = allBookings.map((booking, i) => {
      return {
        id: i + 1,
        ...booking,
      };
    });
    setTimelineFormattedBookings(formattedAllBookings);
  }, [bookings, newBookings]);

  const onDrop = (files) => {
    const reader = new FileReader();
    reader.onload = () => {
      csv.parse(reader.result, (error, data) => {
        // Preserve any existing imported bookings files
        const newBookingsList = newBookings.slice();

        // Remove the csv title row, we don't need it
        data.shift();

        // Format the new bookings into similar format to existing ones
        data.map((item) => {
          const duration = item[1] * (60 * 1000);
          const time = new Date(item[0]).getTime();
          const newBooking = {
            time: time,
            duration: duration,
            userId: item[2],
          };
          newBookingsList.push(newBooking);
        });

        setNewBookings(newBookingsList);
      });
    };

    files.map((file) => {
      reader.readAsBinaryString(file);
    });
  };

  /*
   * Compare existing bookings to new bookings to determine overlap
   * Overlap is calculated as either booking starting in the middle of the other
   * TODO: Warning generated from use of moment().isBetween() in browser:
   * value provided is not in a recognized RFC2822 or ISO format
   * TODO: Comparison does not account for new bookings that overlap with each other
   */
  const compareBookings = (newBookings, existingBookings) => {
    newBookings.map((newBooking, i) => {
      existingBookings.map((existingBooking, j) => {
        const newBookingStart = new Date(newBooking.time);
        const newBookingEnd = newBookingStart + newBooking.duration;
        const existingBookingStart = new Date(existingBooking.time);
        const existingBookingEnd =
          existingBookingStart + existingBooking.duration;

        // Check if the existing event starts during the new one, or vice versa
        // inclusive of the start and end times
        if (
          moment(existingBookingStart).isBetween(
            newBookingStart,
            newBookingEnd,
            undefined,
            []
          ) ||
          moment(newBookingStart).isBetween(
            existingBookingStart,
            existingBookingEnd,
            undefined,
            []
          )
        ) {
          newBooking.overlap = true;
        }
      });
    });
  };

  /*
   * Format the bookings data into objects for the timeline component
   */
  const formatBookings = (bookings = [], bookingGroup) => {
    return bookings.map((booking) => {
      const endTime = moment(booking.time + booking.duration);
      return {
        group: bookingGroup.id,
        title: booking.userId,
        start_time: moment(booking.time),
        end_time: endTime,
        canMove: false,
        canResize: false,
        canChangeGroup: false,
        itemProps: {
          style: {
            background: booking.overlap ? "red" : bookingGroup.defaultColor,
          },
        },
      };
    });
  };

  const existingBookingsGroup = {
    id: 1,
    title: "Existing Bookings",
    defaultColor: "blue",
  };

  const newBookingsGroup = {
    id: 2,
    title: "New Bookings",
    defaultColor: "green",
  };

  const timelineGroups = [existingBookingsGroup, newBookingsGroup];

  const saveNewBookings = () => {
    const allowedBookings = newBookings.filter((booking) => !booking.overlap);
    if (allowedBookings.length === 0) {
      // Exit if there's no new valid bookings to add
      alert("No valid bookings to add");
      return;
    }

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(allowedBookings),
    };

    fetch(`${apiUrl}/bookings`, options)
      .then((response) => response.json())
      .then(setBookings)
      .then(setNewBookings([]));
  };

  return (
    <div className="App">
      <div className="App-header">
        <Dropzone accept=".csv" onDrop={onDrop}>
          {({ getRootProps, getInputProps }) => (
            <section>
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                <p>Drop some files here, or click to select files</p>
              </div>
            </section>
          )}
        </Dropzone>
      </div>
      <div className="App-main">
        <BookingsTimeline
          groups={timelineGroups}
          items={timelineFormattedBookings}
        />
        <div style={{ margin: "1rem" }}>
          <button onClick={saveNewBookings}>Save New Bookings</button>
        </div>
      </div>
    </div>
  );
};
