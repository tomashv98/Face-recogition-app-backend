const validator = require("validator");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken");


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Please enter a valid email")
      }
    }
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 7,
    validate(value) {
      if (value.toLowerCase().includes("password")) {
        throw new Error(`Thats not a valid password`)
      }
    }
  },
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }],
});

// Whenever we send a request JSON.stringify() is called
userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password
  delete userObject.tokens
  return userObject
};

userSchema.methods.generateToken = async function () {
  const user = this;
  const token = jwt.sign({
    _id: user.id.toString()
  }, AUTH_KEY);
  // array1.concat(array2) merge array, returns new array
  user.tokens = user.tokens.concat({
    token
  });
  await user.save()
  return token

};

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({
    email
  })

  if (!user) {
    throw new Error('Unable to login')
  }

  const isMatch = await bcrypt.compare(password, user.password)

  if (!isMatch) {
    throw new Error('Unable to login')
  }

  return user
};

// Hash password before every user.save()
userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8)
  }
  next()
});

const User = mongoose.model("User", userSchema);

module.exports = User;