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
  Spinner,
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
  const [userLeft, setUserLeft] = useState(false);
  const messagesEndRef = useRef(null);
  const userJoinedRef = useRef(null);
  const [toastText, setToastText] = useState("");
  const [userItems, setUserItems] = useState(["guitar", "computer", "bike"]);
  const [offers, setOffers] = useState([{}]);
  const [offer, setOffer] = useState({
    item: "",
    from_user: sendingUser,
    to_user: recievingUser,
    amount: 0,
    accepted: false,
  });
  const [createOffer, setCreateOffer] = useState(false);
  const [currOfferPrice, setCurrOfferPrice] = useState(0);
  const [currOfferItem, setCurrOfferItem] = useState(userItems[0]);
  const [showSuccessOfferToast, setShowSuccessOfferToast] = useState(false);

  useEffect(async () => {
    document.body.style.background = "#e6e0bb";
    let userExists = false;
    await axios
      .get("http://localhost:3001/api/user/exists", {
        params: { username: sendingUser },
      })
      .then((res) => {
        userExists = true;
        if (
          !localStorage.getItem("apiuser") ||
          localStorage.getItem("apiuser") != sendingUser
        ) {
          localStorage.setItem(
            "apiuser",
            JSON.stringify({ username: sendingUser })
          );
        }
      })
      .catch((err) => {
        console.log(err);
      });
    console.log(userExists);

    if (!userExists) {
      await axios
        .post(
          "http://localhost:3001/api/user/registerAPIAccount",
          {},
          {
            params: { username: sendingUser },
          }
        )
        .then((res) => {
          if (res.status == 200) {
            userExists = true;
            localStorage.setItem(
              "apiuser",
              JSON.stringify({ username: sendingUser })
            );
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }

    if (userExists) {
      console.log("here");
      const loggedInUser = JSON.parse(localStorage.getItem("apiuser"));
      if (!loggedInUser || params.sendingUser != loggedInUser.username) {
        if (socket) {
          const win = window.open(
            "http://localhost:3002/chat/" + sendingUser,
            "_blank"
          );
          win.focus();
          return;
        }
      }
      let authed = false;
      await axios
        .get("http://localhost:3001/api/user/apitoken", {
          params: {
            username: sendingUser,
          },
        })
        .then((res) => {
          localStorage.setItem("jwt", res.data.token);
        })
        .catch((err) => console.log(err));

      await axios
        .get("http://localhost:3001/api/messages/all", {
          params: { sendingUser: sendingUser, recievingUser: recievingUser },
          headers: {
            "x-access-token": localStorage.getItem("jwt"),
          },
        })
        .then((res) => {
          if (res.data.auth) {
            console.log("hit");
            setMessages(res.data.messages);
            authed = true;
          } else {
            const win = window.open(
              "http://localhost:3002/chat/" + sendingUser,
              "_blank"
            );
            win.focus();
          }
        })
        .catch((err) => console.log(err));

      if (authed) {
        console.log(
          `sending user: ${sendingUser} reciveing user: ${recievingUser}`
        );
        const socket = io(SOCKET_ENDPOINT);
        localStorage.setItem("socket", socket);
        setSocket(socket);
        socket.emit("connected", {
          user: localStorage.getItem("apiuser"),
          recievingUser: recievingUser,
        });
        socket.on("welcome", (data) => {
          setSocketId(data.socketId);
        });

        socket.on("userHasJoined", (data) => {
          showUserJoinedToast(data);
        });

        socket.on("userHasLeft", (data) => {
          showUserLeftToast(data);
        });

        socket.on("incomingMessage", (data) => {
          updateMessages(data);
        });
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    scrollToToast();
  }, [userJoined, userLeft]);

  const onMsg = (e) => {
    setIsTyping(true);
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
    setToastText("joined");
    setUserJoined(true);
  };

  const showUserLeftToast = () => {
    setToastText("left");
    setUserLeft(true);
  };

  const dismissUserJoined = () => {
    setUserJoined(false);
    setUserLeft(false);
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
      .post("http://localhost:3001/api/messages/newmessage", newMessage, {
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
    setIsTyping(false);
  };

  const backHome = async () => {
    await socket.emit("disconnected", { recievingUser: recievingUser });
    socket.removeAllListeners();
    socket.disconnect(true);
    localStorage.removeItem('apiuser')
    localStorage.removeItem('socket')
    localStorage.removeItem('jwt')
    window.open("http://localhost:3002/chat/" + sendingUser, "_self");
  };

  const clickCreateOffer = () => {
    console.log("creat offer");
    setCreateOffer(!createOffer);
    scrollToBottom();
  };

  const sendOffer = (e) => {
    e.preventDefault();
    const newOffer = {
      item: currOfferItem,
      from_user: sendingUser,
      to_user: recievingUser,
      amount: currOfferPrice,
      accepted: false,
    };

    setOffer(newOffer);
    setOffers([...offers, newOffer]);
    setCurrOfferItem(userItems[0]);
    setCurrOfferPrice(0);
    setShowSuccessOfferToast(true);
    setCreateOffer(!createOffer);
    console.log(offers);
  };

  const closeSuccessOfferToast = () => {
    setShowSuccessOfferToast(false);
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
            style={{
              width: "40rem",
              marginLeft: "auto",
              marginRight: "auto",
              backgroundColor: "#e6e0bb",
              borderColor: "black",
              paddingLeft: "10px",
              paddingRight: "10px",
              paddingTop: "10px",
            }}
          >
            <Card.Header style={{ backgroundColor: "#111247", color: "white" }}>
              <h1>
                Messages
                <div style={{ float: "right" }}>
                  <ToastContainer>
                    <Toast
                      show={userJoined || userLeft}
                      onClose={dismissUserJoined}
                    >
                      <Toast.Header>
                        <img src="" className="rounded me-2" alt="" />
                        <strong className="me-auto">User {toastText}!</strong>
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
              if (params.sendingUser !== m.from_user) {
                return (
                  <div
                    style={{
                      alignSelf: "flex-start",
                      minWidth: "25rem",
                      maxWidth: "30rem",
                      marginBottom: "7px",
                      marginLeft: "7px",
                      marginTop: "7px",
                    }}
                  >
                    <Card bg="dark" text="light" border="light" style={{}}>
                      <Card.Body>
                        <Card.Title>{m.from_user}</Card.Title>
                        <Card.Text>{m.message}</Card.Text>
                      </Card.Body>
                    </Card>
                  </div>
                );
              } else {
                return (
                  <div
                    style={{
                      alignSelf: "flex-end",
                      minWidth: "25rem",
                      maxWidth: "30rem",
                      marginBottom: "7px",
                      marginRight: "7px",
                      marginTop: "7px",
                    }}
                  >
                    <Card bg="success" text="light" border="dark" style={{}}>
                      <Card.Body>
                        <Card.Title>{m.from_user}</Card.Title>
                        <Card.Text>{m.message}</Card.Text>
                      </Card.Body>
                    </Card>
                  </div>
                );
              }
            })}
          </Card>
        </div>
      </div>
      <div>
        <div style={{ marginTop: "10px" }}>
          {isTyping ? (
            <div
              style={{
                width: "30rem",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              <Spinner animation="grow" size="sm" />
              <p style={{ display: "inline-block", marginLeft: "10px" }}>
                {sendingUser} is typing
              </p>
            </div>
          ) : (
            <div
              style={{
                width: "30rem",
                marginLeft: "auto",
                marginRight: "auto",
                marginTop: "40px",
              }}
            ></div>
          )}
          {createOffer ? (
            <Form
              onSubmit={(e) => sendOffer(e)}
              style={{
                width: "40rem",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              <div className="form-group">
                <label for="selectItem">Select Item</label>
                <select
                  value={currOfferItem}
                  className="form-control"
                  id="selectItem"
                  onChange={(e) => setCurrOfferItem(e.target.value)}
                >
                  {userItems.map((m) => {
                    return <option value={m}>{m}</option>;
                  })}
                </select>
              </div>
              <div className="form-group">
                <label for="price">Price</label>
                <input
                  type="number"
                  className="form-control"
                  id="price"
                  placeholder="Enter price"
                  onChange={(e) => setCurrOfferPrice(e.target.value)}
                  value={currOfferPrice}
                />
              </div>
              <div className="form-group">
                <Button
                  type="submit"
                  style={{ marginBottom: "5px", marginTop: "5px" }}
                >
                  Submit offer
                </Button>
              </div>
            </Form>
          ) : (
            ""
          )}
          <div
            style={{
              width: "30rem",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <ToastContainer>
              <Toast
                show={showSuccessOfferToast}
                onClose={closeSuccessOfferToast}
              >
                <Toast.Header>
                  <img src="" className="rounded me-2" alt="" />
                  <strong className="me-auto">Offer sent!</strong>
                  <small className="text-muted">just now</small>
                </Toast.Header>
                <Toast.Body>
                  The offer has been sent to {recievingUser} and he now has the
                  option to accept or decline
                </Toast.Body>
              </Toast>
            </ToastContainer>
          </div>
          <Form
            onSubmit={(e) => sendMessage(e)}
            style={{ width: "40rem", marginLeft: "auto", marginRight: "auto" }}
          >
            <InputGroup className="mb-3" style={{ marginTop: "10px" }}>
              <Button
                style={{ backgroundColor: "#111247" }}
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
                style={{ backgroundColor: "#00gfgff" }}
                id="button-addon1"
                onClick={clickCreateOffer}
              >
                {createOffer ? "Close offer" : "Open offer"}
              </Button>
              <Button
                style={{ backgroundColor: "#746c7c" }}
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
