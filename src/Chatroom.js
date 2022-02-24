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
  Toast,
  ToastContainer,
  Form,
  Spinner
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
  const navigate = useNavigate();
  const [messageValid, setMessageValid] = useState(false);
  const [messageInvalid, setMessageInvalid] = useState(false);
  const [userJoined, setUserJoined] = useState(false);
  const [userLeft, setUserLeft] = useState(false)
  const messagesEndRef = useRef(null);
  const userJoinedRef = useRef(null);
  const [toastText, setToastText] = useState('')

  useEffect(async () => {
    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    if (!loggedInUser || params.sendingUser != loggedInUser.username) {
      if (socket) {
        backHome();
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

    if (authed) {
      const socket = io(SOCKET_ENDPOINT);
      localStorage.setItem("socket", socket);
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

      socket.on("userHasLeft", (data) => {
      showUserLeftToast(data)
    })

      socket.on("incomingMessage", (data) => {
        updateMessages(data);
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    scrollToToast();
  }, [userJoined, userLeft]);


  const onMsg = (e) => {
    setIsTyping(true)
    setCurrMessage(e.target.value);
    setMessageValid(false);
    setMessageInvalid(false);
    if (e.target.value == "") {
      setIsTyping(false);
    }

  };

  const updateMessages = (msgObj) => {
    setMessages((prev) => [...prev, msgObj]);
  };

  const showUserJoinedToast = () => {
    setToastText('joined')
    setUserJoined(true);
  };

  const showUserLeftToast = () => {
    setToastText('left')
    setUserLeft(true)
  }

  const dismissUserJoined = () => {
    setUserJoined(false);
    setUserLeft(false)
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToToast = () => {
    userJoinedRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = (e) => {
    e.preventDefault();
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
    setIsTyping(false)
  };

  const backHome = async() => {
    await socket.emit('disconnected', {recievingUser: recievingUser})
    socket.removeAllListeners();
    socket.disconnect(true);
    navigate("/home");
  };


  return (
    <div ref={userJoinedRef}>
      <Button
        onClick={backHome}
        style={{ marginBottom: "10px", backgroundColor: "#111247" }}
      
      >
        Leave
      </Button>
      <div>
        <div>
          <Card
            style={{ width: "70rem", marginLeft: "auto", marginRight: "auto" }}
          >
            <Card.Header style={{backgroundColor:'#111247', color:'white'}}>
              <h1>
                Messages
                <div style={{ float: "right" }}>
                  <ToastContainer>
                    <Toast show={userJoined || userLeft} onClose={dismissUserJoined}>
                      <Toast.Header>
                        <img src="" className="rounded me-2" alt="" />
                        <strong className="me-auto">User { toastText}!</strong>
                        <small className="text-muted">just now</small>
                      </Toast.Header>
                      <Toast.Body>
                        {recievingUser} has {toastText} the chat
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
          {isTyping ?
          <div style={{ width: "70rem", marginLeft: "auto", marginRight: "auto" }}>
            <Spinner animation="grow" size="sm" /><p style={{display: 'inline-block', marginLeft: '10px'}}>{sendingUser} is typing</p>
            </div>: <div style={{ width: "70rem", marginLeft: "auto", marginRight: "auto", marginTop:'40px' }}></div> }
          <Form
            onSubmit={(e) => sendMessage(e)}
            style={{ width: "70rem", marginLeft: "auto", marginRight: "auto" }}
          >
            <InputGroup className="mb-3" style={{ marginTop: "10px" }}>
              <Button
                style={{backgroundColor: "#111247" }}
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
              <Button
                style={{backgroundColor: '#746c7c'}}
                id="button-addon1"
                onClick={scrollToToast}
              >
                Go to top
              </Button>
            </InputGroup>
          </Form>
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
