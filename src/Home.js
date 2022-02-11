import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  InputGroup,
  FormControl,
  ToastContainer,
  Toast,
} from "react-bootstrap";

export default function Home() {
  const [room, setRoom] = useState("math");
  const [recievingUser, setRecievingUser] = useState("");
  const [user, setUser] = useState({ username: "" });
  const [availableRooms, setAvailableRooms] = useState([
    "math",
    "science",
    "history",
    "english",
  ]);
  const [roomInput, setRoomInput] = useState("");
  const navigate = useNavigate();
  const [hideToast, setHideToast] = useState(true);

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("jwt");
    axios
      .get("http://localhost:3001/user/authenticateUser", {
        headers: {
          "x-access-token": token,
        },
      })
      .then((res) => {
        if (res.data.auth) {
          setUser(loggedInUser);
        } else {
          navigate("/login", { replace: true });
        }
      })
      .catch((err) => {
        console.log("failed");
        navigate("/login", { replace: true });
      });
  }, []);

  const joinRoom = () => {
    navigate(`/groupmessage/${room}/${user.username}`);
  };

  const submitHandle = () => {
    if (user.username == recievingUser) {
      alert("Cannot message yourself");
      return;
    }
    axios
      .get("http://localhost:3001/user/exists", {
        params: { username: recievingUser },
      })
      .then(() => {
        navigate(`/privatemessage/${user.username}/${recievingUser}`);
      })
      .catch((err) => {
        console.log(err);
        alert("Username not found");
        setRecievingUser("");
      });
  };
  const logoutFunction = () => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("user")
    navigate("/login");
  };

  const addRoom = () => {
    setAvailableRooms([...availableRooms, roomInput.toLowerCase()]);
    setRoomInput("");
    setHideToast(false);
    const timer = setTimeout(() => {
      setHideToast(true);
    }, 5000);
    return () => clearTimeout(timer);
  };

  const roomInputHandler = (e) => {
    setRoomInput(e.target.value);
  };

  return (
    <div>
      <Alert variant="success">
        <Alert.Heading>
          Welcome <b>{user.username}</b>
        </Alert.Heading>
        <p>
          Join a room or message a user privately
          <Button
            onClick={logoutFunction}
            variant="danger"
            style={{ float: "right" }}
          >
            LOGOUT
          </Button>
        </p>

        <hr />
      </Alert>
      <div>
        <select
          name="rooms"
          id="rooms"
          onChange={(e) => setRoom(e.target.value)}
        >
          {availableRooms.map((room) => {
            return <option value={room} key={room}>{room}</option>;
          })}
        </select>
        <Button onClick={joinRoom} style={{ marginLeft: "10px" }}>
          Join Room
        </Button>
        {hideToast ? (
          <></>
        ) : (
          <div>
            <ToastContainer>
              <Toast>
                <Toast.Header>
                  <img
                    src="holder.js/20x20?text=%20"
                    className="rounded me-2"
                    alt=""
                  />
                  <strong className="me-auto">Room Added!</strong>
                  <small className="text-muted">just now</small>
                </Toast.Header>
                <Toast.Body>
                  {availableRooms[availableRooms.length - 1]} room is now
                  available
                </Toast.Body>
              </Toast>
            </ToastContainer>
          </div>
        )}
      </div>
      <div>
        <InputGroup className="mb-3" style={{ marginTop: "15px" }}>
          <FormControl
            onChange={(e) => roomInputHandler(e)}
            placeholder="Add custom room"
            aria-label="Recipient's username"
            aria-describedby="basic-addon2"
            value={roomInput}
          />
          <Button
            variant="outline-secondary"
            id="button-addon2"
            variant="primary"
            onClick={addRoom}
          >
            Add Room
          </Button>
        </InputGroup>
      </div>
      <div>
        <InputGroup className="mb-3" style={{ marginTop: "15px" }}>
          <InputGroup.Text id="basic-addon1">@</InputGroup.Text>
          <FormControl
            onChange={(e) => setRecievingUser(e.target.value)}
            value={recievingUser}
            placeholder="Recipient's username"
            aria-label="Recipient's username"
            aria-describedby="basic-addon2"
          />
          <Button
            variant="outline-secondary"
            id="button-addon2"
            variant="primary"
            onClick={submitHandle}
          >
            Message User
          </Button>
        </InputGroup>
      </div>
    </div>
  );
}
