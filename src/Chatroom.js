import React, { useState, useEffect, useRef } from "react";
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
  Toast,
  ToastContainer,
  Form
} from "react-bootstrap";

const SOCKET_ENDPOINT = "http://localhost:3001";

export default function Chatroom() {
  let params = useParams();
  const [sendingUser, setSendingUser] = useState(params.sendingUser);
  const [recievingUser, setRecievingUser] = useState(params.recievingUser);
  const [isTyping, setIsTyping] = useState(false);
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
  const [userJoined, setUserJoined] = useState(false);
  const [toastText, setToastText] = useState({ title: "", body: "" });
  const messagesEndRef = useRef(null)
  const userJoinedRef = useRef(null)

  useEffect(async () => {
    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    if (!loggedInUser || params.sendingUser != loggedInUser.username) {
      if (socket) {
        backHome()
      } else {
        navigate("/", { replace: true });
      }
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
      localStorage.setItem('socket', socket)
      setSocket(socket);
      socket.emit("connected", {
        user: localStorage.getItem("user"),
        recievingUser: recievingUser,
      });
      socket.on("welcome", (data) => {
        setSocketId(data.socketId);
      });

      socket.on("userHasJoined", (data) => {
        showUserJoinedToast(data);
      });

      socket.on("incomingMessage", (data) => {
        updateMessages(data);
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    scrollToToast()
  }, [userJoined])

  const onMsg = (e) => {
    setCurrMessage(e.target.value);
    setMessageValid(false);
    setMessageInvalid(false);
    if (e.target.value == "") {
      setIsTyping(false);
    }

    setUserIsTyping(true);
  };

  const updateMessages = (msgObj) => {
    setMessages((prev) => [...prev, msgObj]);
  };

  const showUserJoinedToast = () => {
    setUserJoined(true);
  };

  const dismissUserJoined = () => {
    setUserJoined(false)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({behavior: "smooth"})
  }

  const scrollToToast = () => {
    userJoinedRef.current?.scrollIntoView({behavior: "smooth"})
  }

  const sendMessage = (e) => {
    e.preventDefault()
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
        <div >
          <Card style={{width: '70rem', marginLeft: 'auto', marginRight:'auto'}} ref={userJoinedRef}>
            <Card.Header>
              <h1>
                Messages
                  <div style={{ float: "right" }} >
                    <ToastContainer>
                      <Toast show={userJoined} onClose={dismissUserJoined}>
                        <Toast.Header>
                          <img
                            src=""
                            className="rounded me-2"
                            alt=""
                          />
                          <strong className="me-auto">User joined!</strong>
                          <small className="text-muted">just now</small>
                        </Toast.Header>
                        <Toast.Body>
                          {recievingUser} has joined the chat
                        </Toast.Body>
                      </Toast>
                    </ToastContainer>
                  </div>
              </h1>
              <h5>
                Messages between you ({sendingUser}) and {recievingUser}
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
                  <Card bg="success" text="light" border="dark">
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
            style={{width: '70rem', marginLeft: 'auto', marginRight:'auto'}}
          />
          <Form onSubmit={(e) => sendMessage(e)} style={{width: '70rem', marginLeft: 'auto', marginRight:'auto'}}>
          <InputGroup className="mb-3" style={{ marginTop: "10px" }}>
            <Button
              variant="outline-primary"
              id="button-addon1"
              type="submit"
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
          </Form>
          <div ref={ messagesEndRef}/>
        </div>
      </div>
    </div>
  );
}
