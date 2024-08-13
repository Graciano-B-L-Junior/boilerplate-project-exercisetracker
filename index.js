const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

const Schema = mongoose.Schema

const userSchema = new Schema({
  name: String,
});

const ExerciseSchema = new Schema({
  username: String,
  description: String,
  duration: Number,
  date: String,
  _id: String
})

const Log = new Schema({
  username: String,
  count: Number,
  _id: String,
  log: []
})

const Exercise = mongoose.model('exercise',ExerciseSchema)

const Users = mongoose.model('username',userSchema)

app.use(express.json())
app.use(express.urlencoded({extended : true}))
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post("/api/users",async function(req,res){
  let username = req.body.username
  const user = await Users({name: username})
  user.save()
  res.json({username:user.name,_id:user.id})
})

app.get("/api/users",async function(req,res){
  let users = await Users.find()
  let array_users = []
  try{
    users.forEach((data)=>{
      array_users.push({
        name:data.name,
        _id:data.id
      })
    })
    res.json(array_users)
  }catch(e){
    res.json(e)
  }
})


app.post("/api/users/:_id/exercises",async function(req,res){
  let _id = req.params._id
  let description = req.body.description
  let duration = req.body.duration
  let date = new Date(req.body.date)
  try{
    const user = await Users.findById(_id)
    const exercise = await Exercise({
      _id: user.id,
      username: user.name,
      date: date.toDateString(),
      duration: duration,
      description: description,
    })
    exercise.save()
    res.json(exercise)
  }
  catch(e){
    res.json(e)
  }
})





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
