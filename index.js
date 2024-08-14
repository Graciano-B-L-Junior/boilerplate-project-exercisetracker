const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

const Schema = mongoose.Schema

const userSchema = new Schema({
  username: String,
});

const ExerciseSchema = new Schema({
  username: String,
  description: String,
  duration: Number,
  date: String,
  user_id: String
})

const Exercise = mongoose.model('exercise',ExerciseSchema)

const Users = mongoose.model('username',userSchema)

Users.deleteMany({}).then((result)=>{
  console.log('All documents deleted:', result);
})

Exercise.deleteMany({}).then((result)=>{

})

app.use(express.json())
app.use(express.urlencoded({extended : true}))
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post("/api/users",async function(req,res){
  let username = req.body.username
  const user = await Users({username: username})
  user.save()
  res.json(user)
})

app.get("/api/users",async function(req,res){
  let users = await Users.find({}).select('_id username')
  let array_users = []
  try{
    users.forEach((data)=>{
      array_users.push({
        name:data.name,
        _id:data.id
      })
    })
    res.json(users)
  }catch(e){
    res.json(e)
  }
})


app.post("/api/users/:_id/exercises",async function(req,res){
  try{
     // const _id = req.body[":_id"];
     const _id = req.params._id;
     const foundUser = await Users.findOne({
         "_id": _id
     })
     if (!foundUser) return res.status(404).json({ "message": `User with id ${_id} not found` })
     const { username } = foundUser
     const { description, duration, date } = req.body;
     const newExercise = {
         "user_Id": _id,
         "date": date ? new Date(date).toDateString() : new Date().toDateString(),
         "duration": duration,
         "description": description,            
     }
     const created = await Exercise.create(newExercise);
     const user = {
         "username": username,
         "description": created.description,
         "duration": created.duration,
         "date": created.date,         
         "_id": _id,
     }
     let updated_user = await Users.findByIdAndUpdate({_id:_id},{
      $set: {"description": created.description,
         "duration": created.duration,
         "date": created.date,   }
     },{new: true,upsert: true})
     console.log(updated_user)
     res.status(201).json(updated_user);
    // const user = Users.findById(_id)
    // if(!user){
    //   res.send("Could not found user")
    // }
    // else{
    //   const exercise = await Exercise({
    //       user_id: user.id,
    //       username: user.name,
    //       date: date ? new Date(date) : new Date(),
    //       duration: duration,
    //       description: description,
    //     })
    //   await exercise.save()
    //   res.json({
    //     _id: user._id,
    //     username: user.name,
    //     date: new Date(exercise.date).toDateString(),
    //     duration: exercise.duration,
    //     description: exercise.description,
    //   })
    // }
  }
  catch(e){
    console.log("oi")
    console.log(e)
    res.json(e)
  }
})

app.get("/api/users/:_id/logs", async function(req,res) {
  try {
    const _id = req.params._id;
    const {from, to, limit} = req.query

    const foundUser = await Users.findOne({
        "_id": _id
    })

    if (!foundUser) return res.status(404).json({ "message": `User with id ${_id} not found` })
    const { username } = foundUser;
    let exercises = await Exercise.find({
        "user_id": _id,
    });

    if (from) {
        const fromDate = new Date(from);
        exercises = exercises.filter(exercise => new Date(exercise.date) >= fromDate);
    }
    if (to) {
        const toDate = new Date(to);
        exercises = exercises.filter(exercise => new Date(exercise.date) <= toDate);
    }
    if (limit) {
        exercises = exercises.splice(0, Number(limit));
    }
    let count = exercises.length;

    const exercisesList = exercises.map(exercise => {
        return {
            "description": exercise.description,
            "duration": exercise.duration,
            "date": exercise.date
        }
    })
    const response = {
      "username": username,
      "count": count,
      "_id": _id,
      "log": exercisesList
  }
    return res.json(response)
} catch (error) {
    console.log(error.message);
    res.status(500).json({
        "message": "Server error"
    })
}
})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
