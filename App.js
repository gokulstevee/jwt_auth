require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs"); // used to encrypt the password
require("./config/database").connect();
const User = require("./model/auth");
const jwt = require("jsonwebtoken");
const authToken = require("./middleware/auth");
const cookieParser = require("cookie-parser"); // middleware whcih parses cookies at the client side

const app = express();

//middlewares
app.use(cookieParser());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("<h1>Hello</h>");
});

app.post("/register", async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;

    if (!(firstname && lastname && email && password)) {
      res.status(400).send("All the fields are required");
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(401).send("User already exist");
    }

    const encyPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstname,
      lastname,
      email: email.toLowerCase(),
      password: encyPassword,
    });

    const token = jwt.sign(
      {
        user_id: user._id,
        email,
      },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );

    user.password = undefined;
    user.token = token;
    res.status(201).json({ user });
  } catch (error) {
    res.send(error);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!(email && password)) {
      res.status(400).send("All fields are required");
    }
    const loginUser = await User.findOne({ email });

    if (!loginUser) {
      res.status(404).send("User not registered");
    }

    // const encyLoginPassword = await bcrypt.hash(password, 10);

    const bool = await bcrypt.compare(password, loginUser.password);

    if (bool) {
      const token = jwt.sign(
        { user_id: loginUser.id, email: email },
        process.env.SECRET_KEY,
        { expiresIn: "1h" }
      );

      loginUser.token = token;
      loginUser.password = undefined;

      // res.status(200).json({ loginUser });
      const options = {
        expiresIn: new Date(new Date() * 3 * 60 * 60 * 1000),
        httpOnly: true,
      };

      res.status(200).cookie("token", token, options).json({
        sucess: true,
        token,
        loginUser,
      });
    } else {
      res.send("Wrong password");
    }
  } catch (error) {
    console.error(error);
  }
});

app.get("/dashboard", authToken, (req, res) => {
  res.send("This is secret");
});

module.exports = app;
