//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


const date = require(__dirname + "/date.js");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//connecting to a mongodb cluster in the mongodb.net 
mongoose.connect("mongodb+srv://admin-Gourab:test123@cluster0.pqka2.mongodb.net/todolistDB"); //after the last forward slash is the name of the database chosen to store our todo list items

// now we would like to create a schema
const itemSchema = mongoose.Schema({
  name: String,
});

// now we would make a model
const Item = mongoose.model("Item", itemSchema);

//making first manual items
const item1 = new Item({
  name: "Welcome to your ToDoList !",
});

const item2 = new Item({
  name: "click on the + sign to add an item ",
});

const item3 = new Item({
  name: "<-- click to delete an item",
});

const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {
  const day = date.getDate();

  // by giving no criteria of finding that will select everything that is in the items collection
  Item.find({}, function (err, foundItems) {
    if (err) {
      console.log(err);
    } else {
      // if only the item collection is previously empty then we add the defualt elements thus reducing the chance of adding the same default elements more than once
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function (err) {
          if (err) console.log(err);
          else
            console.log(
              "Default items successfully added to the items collection ."
            );
        });
        // now after adding the default items we created we have to render the page as well so we will simply redirect the result to the root route
        // so that next time the length of the foundItems array wont be 0 and it will go to the else part and simply render our array to the list.ejs file
        res.redirect("/");
      } else {
        res.render("list", { listTitle: day, newListItems: foundItems });
      }
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  // now we have to make a new item document using this const which is parsed using body parser
  const item = new Item({
    name: itemName,
  });

  // if it is default list
  if(listName instanceof Date){
    item.save();
    res.redirect('/');
  }else{
    List.findOne({name : listName},function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const toBeDeletedItemId = req.body.checkbox; //this stores the id of the element that is checked off
  const listName = req.body.listName ;

  // if the listName is of date type object then we do what we were doing in case of normal deletion from a default page
  if(listName instanceof Date){
    Item.findByIdAndRemove(toBeDeletedItemId, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted checked item.");
        // for reflecting the deletion in the app , we have to redirect so that it shows the present items collection from which the checkedoff is recently deleted
        res.redirect("/");
      }
    });
  }else{

    // now we want to delete a particular element of a particular array of a particular collection
    // thus we gotta use the combination of findOneAndUpdate in mongoose and the $pull operator in mongodb

    List.findOneAndUpdate(
      {name : listName},
      {$pull : {items : {_id : toBeDeletedItemId}}},
      function(err,foundList){
        if(!err){
          res.redirect('/' + listName);
        }
      }
    )
  }

});
  

// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });

// now instead of this static work route we want to be able to create routes dynamically . eg - if the user writes localhost:3000/home it should go the home route and create a brand new page there.

// first we got to make a list schema

const listSchema = mongoose.Schema({
  name: String,
  items: [itemSchema],
});
// for every list we create we want to make a list schema , whose second parameter would make the list dynamically using the item schema

const List = mongoose.model("List", listSchema);

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  // if the list is already made and the user is simply trying to access it , we dont want to make that list again thus we have to check
  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        // if that list is not found with the same name , we should create a list by that name
        const list = new List({
          name: customListName,
          items: defaultItems, //since the page is gonna be new and fresh
        });
        list.save();
        res.redirect("/" + customListName);
        // to show up the newly created list that we made
      } else {
        // we should show the  list that is already made by that name
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

// if heroku gives a port by process.env then take it else locally start it at port 3000
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port,function(){
  console.log("Server has started successfully.");
});
