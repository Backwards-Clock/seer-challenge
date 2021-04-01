import Timeline from "react-calendar-timeline";
import "react-calendar-timeline/lib/Timeline.css";
import moment from "moment";

const BookingsTimeline = ({ groups, items }) => {
  return (
    <div style={{ width: "80%", margin: "1rem auto" }}>
      <Timeline
        groups={groups}
        items={items}
        // hardcoding the date view for simplicity
        defaultTimeStart={moment("01/03/2020", "DD/MM/YYYY")}
        defaultTimeEnd={moment("07/03/2020", "DD/MM/YYYY")}
      />
    </div>
  );
};

export default BookingsTimeline;
