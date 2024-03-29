import { Strategy as LocalStrategy } from "passport-local";
import UsersMongoDao from "../daos/mongodb/UsersMongoDao.js";
import { isValidPassword, createHash } from "./bCrypt.js";

const UsersObj = new UsersMongoDao();
const Users = UsersObj.items;

function initialize(passport) {
  passport.use("login", login);
  passport.use("register", register);
  passport.serializeUser((user, done) => {
    done(null, { id: user._id, username: user.username });
  });
  passport.deserializeUser(({ id }, done) => {
    Users.findById(id, done);
  });
}

const authenticateLogin = async (username, password, done) => {
  Users.findOne({ username: username }, (err, user) => {
    if (err) {
      console.log("Login error: " + err);
      return done(err);
    }
    if (!user) {
      console.log("User not found");
      return done(null, false);
    }
    isValidPassword(user, password).then((isValid) => {
      if (isValid) {
        console.log("Login successful");
        return done(null, user);
      } else {
        console.log("Wrong password");
        return done(null, false);
      }
    });
  });
};

const authenticateRegister = async (username, password, done) => {
  Users.findOne({ username: username }, (err, user) => {
    if (err) {
      console.log("Register error: " + err);
      return done(err);
    }
    if (user) {
      console.log("User already exists");
      return done(null, false);
    }
    const newUser = {
      username: username,
      password: createHash(password),
    };
    Users.create(newUser, (err, userWithId) => {
      if (err) {
        console.log("Error when saving user: " + err);
        return done(err);
      }
      console.log("User registration succesfull");
      return done(null, userWithId);
    });
  });
};

const login = new LocalStrategy(authenticateLogin);
const register = new LocalStrategy(authenticateRegister);

export default initialize;
