import React, { useState, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";
import "./App.css";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import {
  Button,
  InputGroup,
  FormControl,
  Card,
  ProgressBar,
} from "react-bootstrap";

const SOCKET_ENDPOINT = "http://localhost:3001";

export default function Chatroom() {
  const params = useParams();
  const [sendingUser, setSendingUser] = useState(params.sendingUser);
  const [room, setRoom] = useState(params.room);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([{}]);
  const [currMessage, setCurrMessage] = useState("");
  const [socketId, setSocketId] = useState("");
  const [socket, setSocket] = useState();
  const navigate = useNavigate();
  const [messageValid, setMessageValid] = useState(false);
  const [messageInvalid, setMessageInvalid] = useState(false);

  useEffect(async () => {
    let authed = false;
    await axios
      .get("http://localhost:3001/chat/group/messages", {
        params: { room: room },
        headers: {
          "x-access-token": localStorage.getItem("jwt"),
        },
      })
      .then((res) => {
        if (res.data.auth) {
          setMessages(res.data.messages);
          authed = true;
        } else {
          navigate("/login");
        }
      })
      .catch((err) => console.log(err));

    if (authed) {
      const socket = io(SOCKET_ENDPOINT);
      setSocket(socket);
      //socket.emit("connected", localStorage.getItem("user"));
      //socket.on("welcome", (data) => {
      //setSocketId(data.socketId);
      //});
      socket.emit("groupConnect", {
        user: localStorage.getItem("user"),
        room: room,
      });
      socket.on("welcomeToGroup", (data) => {
        setSocketId(data);
      });
      socket.on("incomingGroupMessage", (data) => {
        updateMessages(data);
      });
    }
  }, []);

  const onMsg = (e) => {
    setIsTyping(true);
    setCurrMessage(e.target.value);
    if (e.target.value == "") {
      setIsTyping(false);
    }
  };

  const updateMessages = (msgObj) => {
    console.log("updating");
    setMessages((prev) => [...prev, msgObj]);
  };

  const sendMessage = () => {
    const newMessage = {
      from_user: sendingUser,
      room: room,
      message: currMessage,
    };

    setMessages([...messages, newMessage]);
    axios
      .post("http://localhost:3001/chat/group/newmessage", newMessage, {
        headers: {
          "x-access-token": localStorage.getItem("jwt"),
        },
      })
      .then((res) => {
        if (res.data.auth) {
          socket.emit("sendGroupMessage", newMessage);
        } else {
          backHome();
        }
      })
      .catch((err) => console.log(err));
    setCurrMessage("");
    setIsTyping(false);
  };

  const backHome = () => {
    socket.removeAllListeners();
    socket.disconnect(true);
    navigate("/home");
  };

  return (
    <div>
      <Button
        variant="success"
        onClick={backHome}
        style={{ marginBottom: "10px" }}
      >
        Back Home
      </Button>
      <div>
        <div>
          <Card>
            <Card.Header>
              <h1>Messages in {room}</h1>
              <h5>Signed in as {sendingUser}</h5>
              <h6>Your socket-id: {socketId}</h6>
            </Card.Header>
            {messages.map((m) => {
              if (params.sendingUser === m.from_user) {
                return (
                  <Card bg="dark" text="light" border="light">
                    <Card.Body>
                      <Card.Title>{m.from_user}</Card.Title>
                      <Card.Text>{m.message}</Card.Text>
                    </Card.Body>
                  </Card>
                );
              } else {
                return (
                  <Card bg="warning" text="dark" border="dark">
                    <Card.Body>
                      <Card.Title>{m.from_user}</Card.Title>
                      <Card.Text>{m.message}</Card.Text>
                    </Card.Body>
                  </Card>
                );
              }
            })}
          </Card>
        </div>
      </div>
      <div>
        <div style={{ marginTop: "10px" }}>
          <ProgressBar
            animated
            now={currMessage.length * 2}
            label={`${sendingUser} is typing`}
          />
          <InputGroup className="mb-3" style={{ marginTop: "10px" }}>
            <Button
              variant="outline-primary"
              id="button-addon1"
              onClick={sendMessage}
            >
              Send
            </Button>
            <FormControl
              placeholder="message"
              onChange={(e) => onMsg(e)}
              aria-label="Example text with button addon"
              aria-describedby="basic-addon1"
              value={currMessage}
              isInvalid={messageInvalid}
              isValid={messageValid}
              required
            />
          </InputGroup>
        </div>
      </div>
    </div>
  );
}
