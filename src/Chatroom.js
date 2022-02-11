import React, { useState, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";
import "./App.css";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  InputGroup,
  FormControl,
  Card,
  ProgressBar,
} from "react-bootstrap";

const SOCKET_ENDPOINT = "http://localhost:3001";

export default function Chatroom() {
  let params = useParams();
  const [sendingUser, setSendingUser] = useState(params.sendingUser);
  const [recievingUser, setRecievingUser] = useState(params.recievingUser);
  const [isTyping, setIsTyping] = useState(false);
  const [message, setMessage] = useState({
    from_user: "",
    message: "",
  });
  const [messages, setMessages] = useState([{}]);
  const [currMessage, setCurrMessage] = useState("");
  const [socketId, setSocketId] = useState("");
  const [socket, setSocket] = useState();
  const [typingUser, setTypingUser] = useState("");
  const navigate = useNavigate();
  const [showNoMessages, setShowNoMessages] = useState(false);
  const [messageValid, setMessageValid] = useState(false);
  const [messageInvalid, setMessageInvalid] = useState(false);
  const [userIsTyping, setUserIsTyping] = useState(false);
  const [timeout, setTimeout] = useState(undefined);

  useEffect(async () => {
    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    if (!loggedInUser) {
      navigate("/", { replace: true });
    }
    let authed = false;
    await axios
      .get("http://localhost:3001/chat/private/messages", {
        params: { sendingUser: sendingUser, recievingUser: recievingUser },
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

    if (messages.length === 0) {
      setShowNoMessages(true);
    }

    if (authed) {
      const socket = io(SOCKET_ENDPOINT);
      setSocket(socket);
      socket.emit("connected", localStorage.getItem("user"));
      socket.on("welcome", (data) => {
        setSocketId(data.socketId);
      });
      socket.on("incomingMessage", (data) => {
        updateMessages(data);
      });
    }
  }, []);

  const onMsg = (e) => {
    setCurrMessage(e.target.value);
    setMessageValid(false);
    setMessageInvalid(false);
    if (e.target.value == "") {
      setIsTyping(false);
    }

    if (!userIsTyping) {
      setUserIsTyping(true);
      socket.emit("userIsTyping", sendingUser);
      socket.on("userIsTyping", (data) => {
        console.log(data);
        setTypingUser(data);
      });
      setTimeout(timeoutFunction, 5000);
    } else {
      clearTimeout(timeout);
      setTimeout(timeoutFunction, 5000);
    }
  };

  const timeoutFunction = () => {
    setUserIsTyping(false);
    socket.emit("userStoppedTyping", sendingUser);
  };

  const updateMessages = (msgObj) => {
    setMessages((prev) => [...prev, msgObj]);
  };

  const sendMessage = () => {
    if (currMessage == "") {
      setMessageInvalid(true);
      return;
    }
    setMessageValid(true);
    const newMessage = {
      from_user: sendingUser,
      to_user: recievingUser,
      message: currMessage,
    };

    setMessages([...messages, newMessage]);
    axios
      .post("http://localhost:3001/chat/private/newmessage", newMessage, {
        headers: { "x-access-token": localStorage.getItem("jwt") },
      })
      .then((res) => {
        if (res.data.auth) {
          socket.emit("sendMessage", newMessage);
        } else {
          backHome();
        }
      })
      .catch((err) => console.log(err));
    setCurrMessage("");
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
              <h1>Messages</h1>
              <h5>
                Messages between {sendingUser} to {recievingUser}
              </h5>
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
