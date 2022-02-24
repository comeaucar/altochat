import React from "react";
import "./App.css";
import { Routes, Route, Link, Router } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import "bootstrap/dist/css/bootstrap.min.css";
import Home from "./Home";
import Chatroom from "./Chatroom";
import GroupChat from "./GroupChat";
import EmbeddedChat from "./EmbeddedChat"
function App() {
  return (
    <div className="main">
      
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route
          path="/privatemessage/:sendingUser/:recievingUser"
          element={<Chatroom />}
        />
        <Route
          path="/groupmessage/:room/:sendingUser"
          element={<GroupChat />}
        />
        <Route path="/altochatapi/privatechat/:sendingUser/:recievingUser" element={ <EmbeddedChat />}/>
        </Routes>
    </div>
  );
}

export default App;
