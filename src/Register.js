import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [user, setUser] = useState({
    username: "",
    firstname: "",
    lastname: "",
    password: "",
  });

  const [usernameValidator, setUsernameValidator] = useState(false);

  const navigate = useNavigate();

  const onUsernameChange = (e) => {
    setUser({
      username: e.target.value,
      firstname: user.firstname,
      lastname: user.lastname,
      password: user.password,
    });
    setUsernameValidator(false)
  };
  const onFirstnameChange = (e) => {
    setUser({
      username: user.username,
      firstname: e.target.value,
      lastname: user.lastname,
      password: user.password,
    });
  };

  const onLastNameChange = (e) => {
    setUser({
      username: user.username,
      firstname: user.firstname,
      lastname: e.target.value,
      password: user.password,
    });
  };

  const onPasswordChange = (e) => {
    setUser({
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      password: e.target.value,
    });
  };

  const loginSubmit = (e) => {
    e.preventDefault();
    const newUser = {
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      password: user.password,
    };
    axios
      .post("http://localhost:3001/user/register", newUser)
      .then((res) => {
        if (res.data === 'Username already taken') {
          setUsernameValidator(true);
          alert('Username is taken')
          return
        }
        console.log("success added user");
        navigate("/login");
      })
      .catch((err) => {
        alert("All fields must be filled out");
      });

    setUser({ username: "", firstname: "", lastname: "", password: "" });
  };

  const backToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="main">
      <Form onSubmit={loginSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Username</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter username"
            value={user.username}
            onChange={(e) => onUsernameChange(e)}
            required
            isInvalid={usernameValidator}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>First Name</Form.Label>
          <Form.Control
            type="text"
            value={user.firstname}
            placeholder="Enter first name"
            onChange={(e) => onFirstnameChange(e)}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Last Name</Form.Label>
          <Form.Control
            value={user.lastname}
            type="text"
            placeholder="Enter last name"
            onChange={(e) => onLastNameChange(e)}
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            value={user.password}
            type="password"
            placeholder="Password"
            onChange={(e) => onPasswordChange(e)}
          />
        </Form.Group>
        <Button variant="primary" type="submit">
          Register
        </Button>
      </Form>
      <Button
        variant="secondary"
        onClick={backToLogin}
        style={{ marginTop: "10px" }}
      >
        Login
      </Button>
    </div>
  );
}
