import React, { useState, useEffect } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const [user, setUser] = useState({ username: "", password: "" });
  const navigate = useNavigate();

  useEffect(() => {
    //const loggedInUser = localStorage.getItem("user");
    const token = localStorage.getItem('jwt')
    if (token) {
      axios.get('http://localhost:3001/user/authenticateUser', {
        headers: {
        'x-access-token': token
        }
      }).then((res) => {
        if (res.data.auth) {
          navigate('/home')
        }
      }).catch((err) => {
        console.log(err)
      })
    }
  }, []);

  const onUsernameChange = (e) => {
    setUser({
      username: e.target.value,
      firstname: user.firstname,
      lastname: user.lastname,
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
  const loginSubmit = async (e) => {
    e.preventDefault();
    const loginUser = {
      username: user.username,
      password: user.password,
    };

    await axios
      .get("http://localhost:3001/user/login", {
        params: { username: loginUser.username, password: loginUser.password },
      })
      .then((res) => {
        if (res.data.auth) {
          localStorage.setItem("jwt", res.data.jwt);
          localStorage.setItem("user", JSON.stringify(res.data.user))
          navigate("/home");
        }
      })
      .catch((err) => console.log(err));
  };

  const toRegister = () => {
    navigate('/register')
  }

  return (
    <div className="main">
      <Alert variant="success">
        <Alert.Heading>Welcome to the chat app</Alert.Heading>
        <hr />
        <p className="mb-0">
          Login if you already have an account, or register to create one
        </p>
      </Alert>
      <Form onSubmit={loginSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Username</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter username"
            onChange={(e) => onUsernameChange(e)}
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Password"
            onChange={(e) => onPasswordChange(e)}
          />
        </Form.Group>
        <Button variant="primary" type="submit">
          Login
        </Button>
      </Form>
      <Button variant='secondary' style={{marginTop:'10px'}} onClick={toRegister}>Register</Button>
    </div>
  );
}
